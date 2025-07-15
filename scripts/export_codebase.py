import os
import fnmatch
import pathspec

def get_gitignore_patterns(root_dir):
    """
    Reads gitignore patterns from all .gitignore files in the specified directory
    and its subdirectories.
    
    Args:
        root_dir (str): The root directory to start searching for .gitignore files.
        
    Returns:
        list: A list of gitignore patterns.
    """
    gitignore_patterns = []
    gitignore_path = os.path.join(root_dir, '.gitignore')
    if os.path.exists(gitignore_path):
        with open(gitignore_path, 'r') as f:
            gitignore_patterns.extend(f.read().splitlines())
    return gitignore_patterns

def should_ignore(path, spec):
    """
    Checks if a given path should be ignored based on the gitignore spec.
    
    Args:
        path (str): The path to check.
        spec (pathspec.PathSpec): The PathSpec object from gitignore patterns.
        
    Returns:
        bool: True if the path should be ignored, False otherwise.
    """
    return spec.match_file(path)

def export_codebase_to_file(root_dir, output_file):
    """
    Exports the entire codebase, respecting .gitignore, into a single text file.
    
    Args:
        root_dir (str): The root directory of the codebase.
        output_file (str): The path to the output text file.
    """
    gitignore_patterns = get_gitignore_patterns(root_dir)
    spec = pathspec.PathSpec.from_lines('gitignore', gitignore_patterns)
    
    # Add common patterns for directories that should always be excluded
    # but might not be in .gitignore
    exclude_dirs = {'.git', '__pycache__'}
    
    # Also exclude the output file itself
    output_filename = os.path.basename(output_file)

    with open(output_file, 'w', encoding='utf-8', errors='ignore') as outfile:
        for dirpath, dirnames, filenames in os.walk(root_dir, topdown=True):
            # To properly handle .gitignore, we need to use relative paths from the root
            relative_dirpath = os.path.relpath(dirpath, root_dir)
            if relative_dirpath == '.':
                relative_dirpath = '' # Use empty string for root to make path joining work

            # Filter out directories to not traverse into them
            # Modify dirnames in place to prevent os.walk from traversing them
            dirnames[:] = [d for d in dirnames if not should_ignore(os.path.join(relative_dirpath, d), spec) and d not in exclude_dirs]

            for filename in filenames:
                if filename == output_filename:
                    continue

                file_path = os.path.join(dirpath, filename)
                relative_file_path = os.path.relpath(file_path, root_dir)
                
                if should_ignore(relative_file_path, spec):
                    continue

                try:
                    with open(file_path, 'r', encoding='utf-8', errors='ignore') as infile:
                        content = infile.read()
                        outfile.write(f"--- START OF FILE: {relative_file_path} ---\n")
                        outfile.write(content)
                        outfile.write(f"\n--- END OF FILE: {relative_file_path} ---\n\n")
                except Exception as e:
                    outfile.write(f"--- FAILED TO READ FILE: {relative_file_path} ---\n")
                    outfile.write(f"Error: {e}\n")
                    outfile.write(f"--- END OF FILE: {relative_file_path} ---\n\n")

if __name__ == "__main__":
    # Assumes the script is in a 'scripts' directory at the project root.
    project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
    output_txt_file = os.path.join(project_root, 'file_output.txt')
    
    # We need to install pathspec first.
    try:
        import pathspec
    except ImportError:
        print("pathspec library not found. Please install it by running:")
        print("pip install pathspec")
    else:
        export_codebase_to_file(project_root, output_txt_file)
        print(f"Codebase exported to {output_txt_file}") 