import { BirRow, BirFileRow, SignedBirFile } from '@/lib/types/bir';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge, badgeVariants } from '@/components/ui/badge';
import { BirAnswersData } from '@/lib/validation/bir';
import { format } from 'date-fns';
import { FileIcon, ImageIcon, DownloadIcon } from 'lucide-react'; // Import icons
import { cn } from '@/lib/utils'; // Assuming cn utility is available

interface BirSummaryProps {
  bir: BirRow;
  signedFiles: SignedBirFile[] | null; // Expect signed files
}

// Helper to format field names
const formatFieldName = (fieldName: string): string => {
  return fieldName
    .replace(/_/g, ' ') // Replace underscores with spaces
    .replace(/\b(url|id)\b/gi, (match) => match.toUpperCase()) // Uppercase specific acronyms
    .replace(/\b\w/g, (char) => char.toUpperCase()); // Capitalize first letter of each word
};

// Helper to format file size
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

// Helper to render different value types
const renderValue = (value: any): React.ReactNode => {
  if (typeof value === 'string' && (value.startsWith('http://') || value.startsWith('https://'))) {
    try {
      const url = new URL(value);
      return <a href={url.href} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all">{url.href}</a>;
    } catch (_) {
      return <span className="break-all">{value}</span>; // Render as text if URL is invalid
    }
  }
  if (Array.isArray(value)) {
    return (
      <ul className="list-disc list-inside space-y-1">
        {value.map((item, index) => <li key={index}>{renderValue(item)}</li>)}
      </ul>
    );
  }
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }
  if (value instanceof Date || (typeof value === 'string' && !isNaN(Date.parse(value)))) {
    try {
        return format(new Date(value), 'PPpp');
    } catch (_) {
        return String(value); // Fallback if date parsing fails
    }
  }
  if (value === null || value === undefined || value === '') {
    return <span className="text-muted-foreground italic">Not provided</span>;
  }
  // Default to string conversion for other types
  return String(value);
};

export default function BirSummary({ bir, signedFiles }: BirSummaryProps) {
  const answers = bir.answers as Partial<BirAnswersData>; // Assuming answers are validated upstream

  // Determine badge variant based on status
  const getBadgeVariant = (status: string | null | undefined): NonNullable<Parameters<typeof badgeVariants>[0]>['variant'] => {
    switch (status) {
      case 'approved':
        return 'default'; // Or use a custom 'success' variant if defined in badgeVariants
      case 'submitted':
        return 'secondary';
      case 'pending': // Assuming 'pending' is a possible status
        return 'outline';
      default:
        return 'outline';
    }
  };

  const badgeVariant = getBadgeVariant(bir.status);

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>Business Information Summary</CardTitle>
            <CardDescription>Submitted details for Project ID: {bir.project_id}</CardDescription>
          </div>
          <Badge variant={badgeVariant} className={cn(badgeVariant === 'default' && 'bg-green-100 text-green-800')}> {/* Example custom styling for 'success' */}
            Status: {formatFieldName(bir.status ?? 'Unknown')}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Display Answers */}
        <section>
          <h4 className="text-lg font-semibold mb-3">Submitted Information</h4>
          <Table>
            <TableBody>
              {Object.entries(answers ?? {}).map(([key, value]) => (
                <TableRow key={key}>
                  <TableHead className="w-[30%] font-medium align-top">{formatFieldName(key)}</TableHead>
                  <TableCell className="align-top">{renderValue(value)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </section>

        {/* Display Files */}
        <section>
          <h4 className="text-lg font-semibold mb-3">Uploaded Files</h4>
          {signedFiles && signedFiles.length > 0 ? (
            <ul className="space-y-3">
              {signedFiles.map((file) => (
                <li key={file.id} className="flex items-center gap-3 p-2 border rounded bg-muted/50">
                  <div className="flex-shrink-0">
                    {file.publicUrl && file.mime_type.startsWith('image/') ? (
                      <img src={file.publicUrl} alt={file.original_name} className="h-10 w-10 object-cover rounded" />
                    ) : (
                      <FileIcon className="h-8 w-8 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-grow min-w-0">
                    {file.publicUrl ? (
                      <a
                        href={file.publicUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-primary hover:underline truncate block"
                        title={file.original_name}
                      >
                        {file.original_name}
                      </a>
                    ) : (
                      <span className="font-medium truncate block" title={file.original_name}>{file.original_name}</span>
                    )}
                    <div className="text-xs text-muted-foreground flex items-center gap-2 flex-wrap">
                      <span>{formatFileSize(file.size_bytes)}</span>
                      <span className="hidden sm:inline">•</span>
                      <span className="truncate" title={file.mime_type}>{file.mime_type}</span>
                      <span className="hidden md:inline">•</span>
                      <span className="capitalize">{formatFieldName(file.file_type as string)}</span>
                    </div>
                  </div>
                  {file.publicUrl && (
                    <a
                      href={file.publicUrl}
                      download={file.original_name} // Suggest original filename for download
                      target="_blank" // Open in new tab for non-downloadable types
                      rel="noopener noreferrer"
                      className="flex-shrink-0 ml-auto p-1 text-muted-foreground hover:text-primary"
                      title="Download File"
                    >
                      <DownloadIcon className="h-5 w-5" />
                    </a>
                  )}
                  {!file.publicUrl && (
                    <span className="ml-auto text-xs text-destructive italic">Download unavailable</span>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground italic">No files have been uploaded for this request.</p>
          )}
        </section>

        {/* Timestamps */}
        <section className="text-xs text-muted-foreground border-t pt-4 mt-6">
          <p>Created: {renderValue(bir.created_at)}</p>
          <p>Last Updated: {renderValue(bir.updated_at)}</p>
        </section>
      </CardContent>
    </Card>
  );
} 