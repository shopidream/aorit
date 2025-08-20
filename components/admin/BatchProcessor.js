// components/admin/BatchProcessor.js - 일괄 처리 UI 컴포넌트
import { useState, useRef } from 'react';
import { useAuthContext } from '../../contexts/AuthContext';
import { 
  Card, 
  Button, 
  Alert,
  LoadingSpinner,
  ProgressBar,
  Badge,
  Divider
} from '../ui/DesignSystem';
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  XCircle,
  AlertTriangle,
  Play,
  Pause,
  RefreshCw,
  Download,
  Eye
} from 'lucide-react';

const PROCESSING_STAGES = {
  idle: { name: '대기', color: 'secondary' },
  uploading: { name: '업로드 중', color: 'warning' },
  parsing: { name: '파싱 중', color: 'warning' },
  analyzing: { name: '분석 중', color: 'warning' },
  saving: { name: '저장 중', color: 'warning' },
  completed: { name: '완료', color: 'success' },
  error: { name: '오류', color: 'danger' }
};

export default function BatchProcessor({ onProcessingComplete }) {
  const { getAuthHeaders } = useAuthContext();
  const fileInputRef = useRef(null);
  
  const [files, setFiles] = useState([]);
  const [uploadResults, setUploadResults] = useState([]);
  const [processingResults, setProcessingResults] = useState([]);
  const [currentStage, setCurrentStage] = useState('idle');
  const [progress, setProgress] = useState(0);
  const [totalFiles, setTotalFiles] = useState(0);
  const [processedFiles, setProcessedFiles] = useState(0);
  const [error, setError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showResults, setShowResults] = useState(false);

  // 파일 선택 핸들러
  const handleFileSelect = (event) => {
    const selectedFiles = Array.from(event.target.files);
    const validFiles = selectedFiles.filter(file => {
      const ext = file.name.toLowerCase().split('.').pop();
      return ['pdf', 'doc', 'docx', 'txt'].includes(ext);
    });

    if (validFiles.length !== selectedFiles.length) {
      setError('지원하지 않는 파일 형식이 포함되어 있습니다. PDF, DOC, DOCX, TXT 파일만 업로드 가능합니다.');
    }

    setFiles(validFiles);
    setError('');
  };

  // 파일 제거
  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  // 1단계: 파일 업로드
  const uploadFiles = async () => {
    setCurrentStage('uploading');
    setUploadResults([]);
    
    try {
      const uploadPromises = files.map(async (file, index) => {
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await fetch('/api/admin/batch-process', {
          method: 'POST',
          headers: getAuthHeaders(),
          body: formData
        });
        
        const result = await response.json();
        
        setProgress(((index + 1) / files.length) * 100);
        
        return {
          filename: file.name,
          success: response.ok,
          contractId: result.contractId,
          error: result.error,
          clauseCount: result.clauseCount
        };
      });
      
      const results = await Promise.all(uploadPromises);
      setUploadResults(results);
      
      const successfulUploads = results.filter(r => r.success);
      if (successfulUploads.length === 0) {
        throw new Error('업로드에 성공한 파일이 없습니다');
      }
      
      return successfulUploads;
      
    } catch (error) {
      console.error('업로드 오류:', error);
      setError('파일 업로드 중 오류가 발생했습니다: ' + error.message);
      setCurrentStage('error');
      return null;
    }
  };

  // 2단계: 일괄 분석 처리
  const processContracts = async (uploadedContracts) => {
    setCurrentStage('analyzing');
    setProcessedFiles(0);
    setTotalFiles(uploadedContracts.length);
    
    try {
      const contractIds = uploadedContracts.map(c => c.contractId);
      
      const response = await fetch('/api/admin/batch-process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({
          action: 'process_batch',
          contractIds
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '처리에 실패했습니다');
      }
      
      const results = await response.json();
      setProcessingResults(results.results);
      
      return results;
      
    } catch (error) {
      console.error('처리 오류:', error);
      setError('계약서 처리 중 오류가 발생했습니다: ' + error.message);
      setCurrentStage('error');
      return null;
    }
  };

  // 전체 처리 실행
  const handleStartProcessing = async () => {
    if (files.length === 0) {
      setError('처리할 파일을 선택해주세요');
      return;
    }
    
    setIsProcessing(true);
    setError('');
    setProgress(0);
    
    try {
      // 1단계: 파일 업로드
      const uploadedContracts = await uploadFiles();
      if (!uploadedContracts) {
        setIsProcessing(false);
        return;
      }
      
      // 2단계: 계약서 분석
      const processResults = await processContracts(uploadedContracts);
      if (!processResults) {
        setIsProcessing(false);
        return;
      }
      
      setCurrentStage('completed');
      setShowResults(true);
      
      if (onProcessingComplete) {
        onProcessingComplete(processResults);
      }
      
    } catch (error) {
      console.error('전체 처리 오류:', error);
      setError('처리 중 예상치 못한 오류가 발생했습니다');
      setCurrentStage('error');
    } finally {
      setIsProcessing(false);
    }
  };

  // 처리 재시작
  const handleReset = () => {
    setFiles([]);
    setUploadResults([]);
    setProcessingResults([]);
    setCurrentStage('idle');
    setProgress(0);
    setError('');
    setIsProcessing(false);
    setShowResults(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // 파일 크기 포맷팅
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      {/* 현재 상태 표시 */}
      <Card className="bg-white/70 backdrop-blur-sm border-white/20">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">일괄 처리 시스템</h2>
          <Badge variant={PROCESSING_STAGES[currentStage].color}>
            {PROCESSING_STAGES[currentStage].name}
          </Badge>
        </div>

        {error && (
          <Alert type="error" className="mb-6" dismissible onDismiss={() => setError('')}>
            {error}
          </Alert>
        )}

        {/* 진행률 표시 */}
        {isProcessing && (
          <div className="mb-6">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>{PROCESSING_STAGES[currentStage].name}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <ProgressBar value={progress} variant="primary" />
            
            {currentStage === 'analyzing' && (
              <div className="mt-2 text-sm text-gray-600">
                {processedFiles} / {totalFiles} 파일 처리 완료
              </div>
            )}
          </div>
        )}

        {/* 파일 업로드 영역 */}
        {currentStage === 'idle' && (
          <div>
            <div 
              className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-400 transition-colors cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-700 mb-2">
                계약서 파일을 선택하거나 드래그하세요
              </p>
              <p className="text-gray-500">
                PDF, DOC, DOCX, TXT 파일을 지원합니다 (최대 100개)
              </p>
            </div>
            
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.txt"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        )}

        {/* 선택된 파일 목록 */}
        {files.length > 0 && currentStage === 'idle' && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              선택된 파일 ({files.length}개)
            </h3>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {files.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <FileText className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="font-medium text-gray-900">{file.name}</p>
                      <p className="text-sm text-gray-500">{formatFileSize(file.size)}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={XCircle}
                    onClick={() => removeFile(index)}
                    className="text-red-600 hover:text-red-700"
                  >
                    제거
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 액션 버튼 */}
        <div className="flex justify-between items-center mt-6">
          <div>
            {showResults && (
              <Button
                variant="outline"
                icon={Eye}
                onClick={() => setShowResults(!showResults)}
              >
                결과 {showResults ? '숨기기' : '보기'}
              </Button>
            )}
          </div>
          
          <div className="flex space-x-3">
            {currentStage !== 'idle' && !isProcessing && (
              <Button
                variant="outline"
                icon={RefreshCw}
                onClick={handleReset}
              >
                다시 시작
              </Button>
            )}
            
            {currentStage === 'idle' && files.length > 0 && (
              <Button
                variant="primary"
                icon={Play}
                onClick={handleStartProcessing}
                disabled={isProcessing}
              >
                처리 시작
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* 처리 결과 */}
      {showResults && (uploadResults.length > 0 || processingResults.length > 0) && (
        <Card className="bg-white/70 backdrop-blur-sm border-white/20">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">처리 결과</h3>
          
          {/* 업로드 결과 */}
          {uploadResults.length > 0 && (
            <div className="mb-6">
              <h4 className="font-medium text-gray-800 mb-3">파일 업로드 결과</h4>
              <div className="space-y-2">
                {uploadResults.map((result, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      {result.success ? (
                        <CheckCircle className="w-5 h-5 text-emerald-600" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-600" />
                      )}
                      <div>
                        <p className="font-medium text-gray-900">{result.filename}</p>
                        {result.success ? (
                          <p className="text-sm text-emerald-600">
                            {result.clauseCount}개 조항 추출됨
                          </p>
                        ) : (
                          <p className="text-sm text-red-600">{result.error}</p>
                        )}
                      </div>
                    </div>
                    <Badge variant={result.success ? 'success' : 'danger'}>
                      {result.success ? '성공' : '실패'}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 분석 결과 */}
          {processingResults.length > 0 && (
            <div>
              <Divider className="my-6" />
              <h4 className="font-medium text-gray-800 mb-3">AI 분석 결과</h4>
              <div className="space-y-2">
                {processingResults.map((result, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      {result.status === 'processed' ? (
                        <CheckCircle className="w-5 h-5 text-emerald-600" />
                      ) : result.status === 'already_processed' ? (
                        <AlertTriangle className="w-5 h-5 text-amber-600" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-600" />
                      )}
                      <div>
                        <p className="font-medium text-gray-900">{result.filename}</p>
                        <p className="text-sm text-gray-600">
                          {result.status === 'processed' && `${result.savedClauses}개 새로운 조항 발견`}
                          {result.status === 'already_processed' && '이미 처리된 파일'}
                          {result.status === 'not_found' && '파일을 찾을 수 없음'}
                        </p>
                      </div>
                    </div>
                    <Badge 
                      variant={
                        result.status === 'processed' ? 'success' : 
                        result.status === 'already_processed' ? 'warning' : 'danger'
                      }
                    >
                      {result.status === 'processed' ? '분석완료' : 
                       result.status === 'already_processed' ? '중복' : '오류'}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 요약 통계 */}
          {processingResults.length > 0 && (
            <div className="mt-6 p-4 bg-blue-50 rounded-xl">
              <h4 className="font-medium text-blue-800 mb-2">처리 요약</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-blue-600">전체 파일</p>
                  <p className="font-semibold text-blue-800">{processingResults.length}개</p>
                </div>
                <div>
                  <p className="text-emerald-600">처리 성공</p>
                  <p className="font-semibold text-emerald-800">
                    {processingResults.filter(r => r.status === 'processed').length}개
                  </p>
                </div>
                <div>
                  <p className="text-amber-600">중복/스킵</p>
                  <p className="font-semibold text-amber-800">
                    {processingResults.filter(r => r.status === 'already_processed').length}개
                  </p>
                </div>
                <div>
                  <p className="text-purple-600">새 조항</p>
                  <p className="font-semibold text-purple-800">
                    {processingResults.reduce((sum, r) => sum + (r.savedClauses || 0), 0)}개
                  </p>
                </div>
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}