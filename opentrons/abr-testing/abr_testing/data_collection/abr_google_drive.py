"""Read ABR run logs from google drive."""
import argparse
import os
import sys
import json
from datetime import datetime, timedelta
from abr_testing.data_collection import read_robot_logs
from typing import Set, Dict, Any, Tuple, List, Union
from abr_testing.automation import google_drive_tool, google_sheets_tool


def get_modules(file_results: Dict[str, str]) -> Dict[str, Any]:
    """Get module IPs and models from run log."""
    modList = (
        "heaterShakerModuleV1",
        "temperatureModuleV2",
        "magneticBlockV1",
        "thermocyclerModuleV2",
    )
    all_modules = {key: "" for key in modList}
    for module in file_results.get("modules", []):
        if isinstance(module, dict) and module.get("model") in modList:
            try:
                all_modules[module["model"]] = module["serialNumber"]
            except KeyError:
                all_modules[module["model"]] = "EMPTYSN"

    return all_modules


def create_data_dictionary(
    runs_to_save: Union[Set[str], str],
    storage_directory: str,
    issue_url: str,
    plate: str,
    accuracy: Any,
) -> Tuple[List[List[Any]], List[str], List[List[Any]], List[str]]:
    """Pull data from run files and format into a dictionary."""
    runs_and_robots: List[Any] = []
    runs_and_lpc: List[Dict[str, Any]] = []
    for filename in os.listdir(storage_directory):
        file_path = os.path.join(storage_directory, filename)
        if file_path.endswith(".json"):
            with open(file_path) as file:
                file_results = json.load(file)
        else:
            continue
        if not isinstance(file_results, dict):
            continue
        run_id = file_results.get("run_id", "NaN")
        if run_id in runs_to_save:
            robot = file_results.get("robot_name")
            protocol_name = file_results["protocol"]["metadata"].get("protocolName", "")
            software_version = file_results.get("API_Version", "")
            left_pipette = file_results.get("left", "")
            right_pipette = file_results.get("right", "")
            extension = file_results.get("extension", "")
            (
                num_of_errors,
                error_type,
                error_code,
                error_instrument,
                error_level,
            ) = read_robot_logs.get_error_info(file_results)

            all_modules = get_modules(file_results)

            start_time_str, complete_time_str, start_date, run_time_min = (
                "",
                "",
                "",
                0.0,
            )
            try:
                start_time = datetime.strptime(
                    file_results.get("startedAt", ""), "%Y-%m-%dT%H:%M:%S.%f%z"
                )
                adjusted_start_time = start_time - timedelta(hours=5)
                start_date = str(adjusted_start_time.date())
                start_time_str = str(adjusted_start_time).split("+")[0]
                complete_time = datetime.strptime(
                    file_results.get("completedAt", ""), "%Y-%m-%dT%H:%M:%S.%f%z"
                )
                adjusted_complete_time = complete_time - timedelta(hours=5)
                complete_time_str = str(adjusted_complete_time).split("+")[0]
                run_time = complete_time - start_time
                run_time_min = run_time.total_seconds() / 60
            except ValueError:
                pass  # Handle datetime parsing errors if necessary

            if run_time_min > 0:
                row = {
                    "Robot": robot,
                    "Run_ID": run_id,
                    "Protocol_Name": protocol_name,
                    "Software Version": software_version,
                    "Date": start_date,
                    "Start_Time": start_time_str,
                    "End_Time": complete_time_str,
                    "Run_Time (min)": run_time_min,
                    "Errors": num_of_errors,
                    "Error_Code": error_code,
                    "Error_Type": error_type,
                    "Error_Instrument": error_instrument,
                    "Error_Level": error_level,
                    "Left Mount": left_pipette,
                    "Right Mount": right_pipette,
                    "Extension": extension,
                }
                tc_dict = read_robot_logs.thermocycler_commands(file_results)
                hs_dict = read_robot_logs.hs_commands(file_results)
                tm_dict = read_robot_logs.temperature_module_commands(file_results)
                pipette_dict = read_robot_logs.instrument_commands(file_results)
                notes = {"Note1": "", "Jira Link": issue_url}
                plate_measure = {
                    "Plate Measured": plate,
                    "End Volume Accuracy (%)": accuracy,
                }
                row_for_lpc = {**row, **all_modules, **notes}
                row_2 = {
                    **row,
                    **all_modules,
                    **notes,
                    **hs_dict,
                    **tm_dict,
                    **tc_dict,
                    **pipette_dict,
                    **plate_measure,
                }
                headers: List[str] = list(row_2.keys())
                # runs_and_robots[run_id] = row_2
                runs_and_robots.append(list(row_2.values()))
                # LPC Data Recording
                runs_and_lpc, headers_lpc = read_robot_logs.lpc_data(
                    file_results, row_for_lpc, runs_and_lpc
                )
            else:
                continue
    transposed_runs_and_robots = list(map(list, zip(*runs_and_robots)))
    transposed_runs_and_lpc = list(map(list, zip(*runs_and_lpc)))
    return transposed_runs_and_robots, headers, transposed_runs_and_lpc, headers_lpc


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Read run logs on google drive.")
    parser.add_argument(
        "storage_directory",
        metavar="STORAGE_DIRECTORY",
        type=str,
        nargs=1,
        help="Path to long term storage directory for run logs.",
    )
    parser.add_argument(
        "folder_name",
        metavar="FOLDER_NAME",
        type=str,
        nargs=1,
        help="Google Drive folder name. Open desired folder and copy string after drive/folders/.",
    )
    parser.add_argument(
        "google_sheet_name",
        metavar="GOOGLE_SHEET_NAME",
        type=str,
        nargs=1,
        help="Google sheet name.",
    )
    parser.add_argument(
        "email", metavar="EMAIL", type=str, nargs=1, help="opentrons gmail."
    )
    args = parser.parse_args()
    folder_name = args.folder_name[0]
    storage_directory = args.storage_directory[0]
    google_sheet_name = args.google_sheet_name[0]
    email = args.email[0]
    try:
        credentials_path = os.path.join(storage_directory, "credentials.json")
    except FileNotFoundError:
        print(f"Add credentials.json file to: {storage_directory}.")
        sys.exit()
    google_drive = google_drive_tool.google_drive(credentials_path, folder_name, email)
    # Get run ids on google sheet
    google_sheet = google_sheets_tool.google_sheet(
        credentials_path, google_sheet_name, 0
    )

    run_ids_on_gs = google_sheet.get_column(2)
    run_ids_on_gs = set(run_ids_on_gs)

    # Uploads files that are not in google drive directory
    google_drive.upload_missing_files(storage_directory)

    # Run ids in google_drive_folder
    run_ids_on_gd = read_robot_logs.get_run_ids_from_google_drive(google_drive)
    missing_runs_from_gs = read_robot_logs.get_unseen_run_ids(
        run_ids_on_gd, run_ids_on_gs
    )
    # Add missing runs to google sheet
    (
        transposed_runs_and_robots,
        headers,
        transposed_runs_and_lpc,
        headers_lpc,
    ) = create_data_dictionary(missing_runs_from_gs, storage_directory, "", "", "")

    start_row = google_sheet.get_index_row() + 1
    google_sheet.batch_update_cells(transposed_runs_and_robots, "A", start_row, "0")

    # Add LPC to google sheet
    google_sheet_lpc = google_sheets_tool.google_sheet(credentials_path, "ABR-LPC", 0)
    start_row_lpc = google_sheet_lpc.get_index_row() + 1
    google_sheet_lpc.batch_update_cells(
        transposed_runs_and_lpc, "A", start_row_lpc, "0"
    )
