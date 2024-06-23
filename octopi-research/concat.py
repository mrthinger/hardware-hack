from typing import TypedDict
import json
import os
import urllib.request
from tqdm import tqdm
import glob

class DocsGenFileInputs(TypedDict):
    file: str

def gprompt_docs_gen_file(inputs: DocsGenFileInputs) -> str:
    api_key = 'graphprompt_2Dd2orU5yZMDi3X33BSTCrD4La8bitdKSQQ7MsMxt1yH'

    url = "https://api.graphprompt.ai/docs-gen-file"
    headers = {
        "Content-Type": "application/json",
        "Authorization": api_key,
    }
    data = json.dumps(inputs).encode("utf-8")

    req = urllib.request.Request(url, data=data, headers=headers, method="POST")
    with urllib.request.urlopen(req) as response:
        if response.status != 200:
            raise Exception(f"GraphPrompt API request failed with status {response.status}")

        response_data = response.read().decode("utf-8")
        parsed_response_data = json.loads(response_data)
        return parsed_response_data["result"]
    
import concurrent.futures

def process_file(file_path: str) -> tuple:
    if os.path.isfile(file_path):
        with open(file_path, 'r', encoding='utf-8') as file:
            file_content = file.read()
            inputs = DocsGenFileInputs(file=file_content)
            summary = gprompt_docs_gen_file(inputs)
            return file_content, f"File: {file_path}\n{summary}\n"
    return "", ""

def concat_and_summarize_files(directory: str):
    all_files = glob.glob(f"{directory}/**/*.py", recursive=True)
    concatenated_content = ""
    concatenated_summaries = ""

    with concurrent.futures.ThreadPoolExecutor(max_workers=20) as executor:
        futures = {executor.submit(process_file, file_path): file_path for file_path in all_files}
        for future in tqdm(concurrent.futures.as_completed(futures), total=len(futures), desc="Processing files"):
            file_content, summary = future.result()
            concatenated_content += file_content + "\n"
            concatenated_summaries += summary

    with open("concatenated_content.txt", "w", encoding="utf-8") as content_file:
        content_file.write(concatenated_content)

    with open("concatenated_summaries.txt", "w", encoding="utf-8") as summary_file:
        summary_file.write(concatenated_summaries)

    print("Original Text saved to concatenated_content.txt")
    print("Summarized Text saved to concatenated_summaries.txt")

concat_and_summarize_files("./software")
