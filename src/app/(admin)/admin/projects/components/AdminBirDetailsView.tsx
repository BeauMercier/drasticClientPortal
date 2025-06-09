import React from 'react';
import { BirRow } from '@/lib/types/bir';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BirAnswersData } from '@/lib/validation/bir';

interface AdminBirDetailsViewProps {
  bir: BirRow | null | undefined;
}

const AdminBirDetailsView: React.FC<AdminBirDetailsViewProps> = ({ bir }) => {
  if (!bir || !bir.answers) {
    return (
      <p className="text-muted-foreground italic">
        No Business Information Request (BIR) has been submitted for this project yet.
      </p>
    );
  }

  // Helper to render a field
  const renderField = (label: string, value: any) => {
    if (!value || (Array.isArray(value) && value.length === 0)) {
      return null;
    }
    return (
      <div className="mb-4">
        <h4 className="font-semibold text-md mb-1">{label}</h4>
        {Array.isArray(value) ? (
          <ul className="list-disc list-inside pl-2">
            {value.map((item, index) => (
              <li key={index} className="text-gray-700 dark:text-gray-300">{item.toString()}</li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{value.toString()}</p>
        )}
      </div>
    );
  };
  
  const answers = bir.answers as BirAnswersData;
  const { status, submitted_at } = bir;

  return (
    <div className="space-y-6">
       <Card>
            <CardHeader>
                <CardTitle>BIR Submission Status</CardTitle>
                <CardDescription>Status: <span className="font-semibold capitalize p-1 bg-gray-200 dark:bg-gray-700 rounded-md">{status}</span></CardDescription>
            </CardHeader>
            <CardContent>
                {submitted_at && <p><strong>Submitted On:</strong> {new Date(submitted_at).toLocaleString()}</p>}
            </CardContent>
        </Card>

      <Card>
        <CardHeader>
          <CardTitle>Company Information</CardTitle>
        </CardHeader>
        <CardContent>
          {renderField('Official Company Name', answers.official_company_name)}
          {renderField('Official Phone', answers.official_company_phone)}
          {renderField('Official Email', answers.official_company_email)}
          {renderField('Official Address', answers.official_company_address)}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Contact & Online Presence</CardTitle>
        </CardHeader>
        <CardContent>
          {renderField('Contact Email', answers.email)}
          {renderField('Website URL', answers.website_url)}
          {renderField('Facebook URL', answers.facebook_url)}
          {renderField('Instagram URL', answers.instagram_url)}
          {renderField('Other Social Links', answers.other_social_links)}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Business Details</CardTitle>
        </CardHeader>
        <CardContent>
          {renderField('Services Description', answers.services_description)}
          {renderField('Company History & Mission', answers.company_history_mission)}
          {renderField('Team Member Profiles', answers.team_member_profiles)}
          {renderField('Certifications, Testimonials, Case Studies', answers.certifications_testimonials_case_studies)}
          {renderField('Partnerships & Affiliations', answers.partnerships_affiliations)}
          {renderField('FAQs & Key Information', answers.faqs_key_information)}
          {renderField('Specific Feature Requests', answers.specific_features_requests)}
          {renderField('Additional Comments', answers.additional_comments)}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminBirDetailsView; 