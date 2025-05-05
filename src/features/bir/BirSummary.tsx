import { BirRow } from '@/lib/types/bir';
import { isValidElement } from 'react';

// Helper to safely render answer values, handling null/undefined/non-string types
function renderAnswer(value: any): React.ReactNode {
    if (value === null || typeof value === 'undefined') {
        return <span className="text-muted-foreground italic">Not provided</span>;
    }
    if (Array.isArray(value)) {
        // Filter out non-string/empty values before joining
        const validItems = value.filter(item => typeof item === 'string' && item.trim() !== '');
        return validItems.length > 0 ? validItems.join(', ') : <span className="text-muted-foreground italic">None</span>;
    }
    if (typeof value === 'object' || typeof value === 'boolean') {
        return JSON.stringify(value);
    }
    // For strings and numbers
    return String(value);
}

// Type guard for better type checking of answers
function isValidAnswersObject(answers: any): answers is Record<string, any> & { business_name?: string; industry?: string; colours?: any } {
    return typeof answers === 'object' && answers !== null && !Array.isArray(answers);
}

interface BirSummaryProps {
    bir: BirRow | null | undefined;
}

/**
 * Read-only component to display submitted Business Information Request details.
 * Suitable for Designers and Admins.
 */
export default function BirSummary({ bir }: BirSummaryProps) {

    if (!bir) {
        return <p className="text-muted-foreground italic">No Business Information has been submitted for this project yet.</p>;
    }

    // Safely access answers
    const answers = isValidAnswersObject(bir.answers) ? bir.answers : {};

    return (
        <div className="space-y-3 p-4 border rounded-lg shadow-sm bg-card text-card-foreground">
            <h3 className="text-lg font-semibold border-b pb-2">Business Information Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <div className="font-medium">Status:</div>
                {/* TODO: Add badge or color coding for status */} 
                 <div className='capitalize'>{bir.status ?? 'Unknown'}</div>

                <div className="font-medium">Business Name:</div>
                <div>{renderAnswer(answers.business_name)}</div>

                <div className="font-medium">Industry:</div>
                <div>{renderAnswer(answers.industry)}</div>

                <div className="font-medium">Brand Colours:</div>
                 {/* Renders colours array as comma-separated string */} 
                 <div>{renderAnswer(answers.colours)}</div>
                 
                 {/* TODO: Add display for other fields from birAnswersSchema */} 
                 {/* Example: 
                 <div className="font-medium">Target Audience:</div>
                 <div>{renderAnswer(answers.target_audience)}</div> 
                 */}
             </div>

             {/* Optional: Display submission/update timestamps */} 
             <div className="text-xs text-muted-foreground pt-2 border-t mt-3">
                 Submitted: {bir.submitted_at ? new Date(bir.submitted_at).toLocaleString() : 'N/A'} | 
                 Last Updated: {bir.updated_at ? new Date(bir.updated_at).toLocaleString() : 'N/A'}
            </div>
        </div>
    );
} 