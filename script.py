import os
import glob

def combine_all_code(root_directory, output_file):
    # List of common code file extensions
    code_extensions = {
        '.py', '.js', '.java', '.cpp', '.c', '.h', '.css', '.html', 
        '.php', '.rb', '.swift', '.go', '.ts', '.jsx', '.tsx'
    }
    
    # Folders to ignore
    ignore_folders = {
        'node_modules',
        'venv',
        '.next',
        'env',
        'dist',
        'build',
        '__pycache__',
        '.git',
        'vendor',
        'packages'
    }

    with open(output_file, 'w', encoding='utf-8') as outfile:
        # Walk through directory
        for root, dirs, files in os.walk(root_directory):
            # Remove ignored folders from dirs list
            dirs[:] = [d for d in dirs if d not in ignore_folders]
            
            # Process files in current directory
            for file in files:
                filepath = os.path.join(root, file)
                # Check if file extension is a code file
                if os.path.splitext(file)[1].lower() in code_extensions:
                    try:
                        # Write file path as header
                        outfile.write(f'\n\n// ================ {filepath} ================\n\n')
                        
                        # Read and write content
                        with open(filepath, 'r', encoding='utf-8') as infile:
                            outfile.write(infile.read())
                    except Exception as e:
                        outfile.write(f'// Error reading file {filepath}: {str(e)}\n')

# Usage
root_dir = "."  # Use "." for current directory or provide specific path
output = "all_code.txt"  # Output file name

print("Starting to combine code files...")
combine_all_code(root_dir, output)
print(f"Finished! Check {output} for the combined code.")