import { DocumentPreview } from './DocumentPreview';
import { FileProgressMap } from '../../hooks/useSendMessage';
import { LinearProgress } from '../Loader';

interface FileUploadPreviewProps {
  attachmentFiles: File[];
  handleRemoveFile: (indexToRemove: number) => void;
  /** Per-file progress from useSendMessage — undefined when not uploading */
  fileProgress?: FileProgressMap;
  /** Optional cancel handler per file */
  onCancelUpload?: (index: number) => void;
  overallProgress?: number;
}

export const FileUploadPreview = ({
  attachmentFiles,
  handleRemoveFile,
  fileProgress,
  onCancelUpload,
  overallProgress,
}: FileUploadPreviewProps) => {

  

  return (
    <div className=''>
      {overallProgress! > 0 && <LinearProgress progress={overallProgress!} />}
      <div className='flex items-center flex-wrap gap-4 bg-white dark:bg-black p-4 justify-start'>
        {attachmentFiles.map((file, i) => (
          <div key={`${file.name}-${i}`} className='size-24 rounded-lg overflow-hidden'>
            <DocumentPreview
              index={i}
              onRemove={handleRemoveFile}
              file={file}
              variant='square'
              // Each file gets its own 0–100 progress value
              uploadProgress={fileProgress?.get(i)}
              onCancelUpload={onCancelUpload}
            />
          </div>
        ))}
      </div>
    </div>
  );
};
