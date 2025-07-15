import os

# List of all relevant files for the auth and BIR features
# We will iterate through this list, read each file, and append its content to the output file.
files_to_export = [
    # --- Feature: Authentication & User Session Management ---
    # UI Components (Client-Side)
    'src/features/auth/components/LoginForm.tsx',
    'src/features/auth/components/PasswordResetForm.tsx',
    'src/app/login/page.tsx',
    # State Management & Hooks (Client-Side)
    'src/features/auth/contexts/AuthContext.tsx',
    'src/features/auth/hooks/useAuth.ts',
    # API Routes (Server-Side)
    'src/app/api/auth/check/route.ts',
    'src/app/api/auth/logout/route.ts',
    'src/app/api/auth/session/route.ts',
    # Core Logic & Configuration
    'src/middleware.ts',
    'src/lib/supabase/client.ts',
    'src/lib/supabase/server.ts',
    'src/lib/supabase/api-auth.ts',
    # --- Feature: Business Information Request (BIR) ---
    # UI Components (Client-Side)
    'src/features/bir/MultiStepBirForm.tsx',
    'src/features/bir/steps/CompanyDetailsStep.tsx',
    'src/features/bir/steps/ContactPresenceStep.tsx',
    'src/features/bir/steps/FileUploadStep.tsx',
    'src/features/bir/steps/FinalCommentsStep.tsx',
    'src/features/bir/steps/OfficialInfoStep.tsx',
    'src/features/bir/steps/SupportingInfoStep.tsx',
    'src/features/bir/steps/WebsiteSpecificsStep.tsx',
    'src/app/(client)/client/projects/web-design/[id]/page.tsx',
    # State Management & Hooks (Client-Side)
    'src/features/bir/useBir.ts',
    # API Route & Data Handling (Server-Side)
    'src/app/api/bir/route.ts',
    'src/app/api/bir/create-upload-url/route.ts',
    'src/app/api/bir/record-file/route.ts',
    # Core Logic & Validation
    'src/lib/api/bir.ts',
    'src/lib/validation/bir.ts',
    # Database Schema & Security
    'supabase/migrations/20250523192529_initial_schema_from_live.sql',
    'supabase/migrations/20250714175524_fix_bir_rls_policy.sql',
]

output_filename = 'feature_export.txt'

def export_files():
    """
    Reads the content of each file in the files_to_export list and writes it
    to a single output file, with headers indicating the original file path.
    """
    # Ensure the script is run from the project root for correct pathing
    project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    os.chdir(project_root)

    with open(output_filename, 'w', encoding='utf-8') as outfile:
        print(f"Starting export to {output_filename}...")
        for filepath in files_to_export:
            header = f"--- START OF FILE: {filepath} ---\n"
            footer = f"--- END OF FILE: {filepath} ---\n\n\n"
            
            outfile.write(header)
            print(f"Exporting {filepath}...")
            
            try:
                with open(filepath, 'r', encoding='utf-8', errors='ignore') as infile:
                    content = infile.read()
                    outfile.write(content)
            except FileNotFoundError:
                outfile.write(f"!!! FILE NOT FOUND AT PATH: {filepath} !!!\n")
                print(f"Warning: Could not find file {filepath}")
            except Exception as e:
                outfile.write(f"!!! ERROR READING FILE: {filepath} - {e} !!!\n")
                print(f"Error reading {filepath}: {e}")

            outfile.write(footer)
    
    print(f"Successfully exported {len(files_to_export)} files to {output_filename}.")

if __name__ == '__main__':
    export_files() 