import os

def export_files_to_txt(file_paths, output_file):
    """
    Exports the content of multiple files into a single .txt file.

    Args:
        file_paths (list): A list of relative paths to the files to be exported.
        output_file (str): The path to the output .txt file.
    """
    # Get the absolute path for the output file in the project root
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(script_dir)
    output_path = os.path.join(project_root, output_file)

    with open(output_path, 'w', encoding='utf-8') as outfile:
        for file_path in file_paths:
            full_path = os.path.join(project_root, file_path)
            
            header = f"--- START OF {file_path} ---\n\n"
            footer = f"\n\n--- END OF {file_path} ---\n\n"
            
            outfile.write(header)
            
            try:
                with open(full_path, 'r', encoding='utf-8') as infile:
                    outfile.write(infile.read())
            except FileNotFoundError:
                outfile.write(f"!!! FILE NOT FOUND AT: {file_path} !!!")
            except Exception as e:
                outfile.write(f"!!! ERROR READING FILE: {e} !!!")
            
            outfile.write(footer)
    
    print(f"Successfully exported {len(file_paths)} files to {output_path}")

if __name__ == "__main__":
    # List of client-viewable files based on codebase analysis
    client_files = [
        "src/app/(client)/client/page.tsx",
        "src/app/(client)/client/my-profile/page.tsx",
        "src/app/(client)/client/my-profile/business-info/page.tsx",
        "src/app/(client)/client/projects/page.tsx",
        "src/app/(client)/client/billing/page.tsx",
        "src/app/(client)/client/projects/web-design/[id]/page.tsx",
        "src/app/(client)/client/projects/logo-design/[id]/page.tsx",
        "src/app/(client)/client/projects/social-graphics/[id]/page.tsx",
        "src/components/client/ClientSidebar.tsx",
        "src/app/login/page.tsx",
        "src/app/register/page.tsx",
        "src/app/reset-password/page.tsx",
        "src/app/update-password/page.tsx",
        "src/features/auth/components/LoginForm.tsx",
        "src/features/auth/components/RegisterForm.tsx",
        "src/features/auth/components/PasswordResetForm.tsx",
        "src/features/auth/components/UpdatePasswordForm.tsx",
        "src/features/projects/components/ProjectList.tsx",
        "src/features/billing/components/InvoiceList.tsx"
    ]
    
    output_filename = "client_view_export.txt"
    
    export_files_to_txt(client_files, output_filename)
