"""Migrate the persistence directory from schema 3 to 4.

Summary of changes from schema 3:

- Adds a new "run_time_parameter_values_and_defaults" column to analysis table
- Adds a new "run_time_parameters" column to run table
"""

from pathlib import Path
from contextlib import ExitStack
import shutil
from typing import Any

import sqlalchemy

from ..database import sql_engine_ctx
from ..tables import schema_4
from .._folder_migrator import Migration

_DB_FILE = "robot_server.db"


class Migration3to4(Migration):  # noqa: D101
    def migrate(self, source_dir: Path, dest_dir: Path) -> None:
        """Migrate the persistence directory from schema 3 to 4."""
        # Copy over all existing directories and files to new version
        for item in source_dir.iterdir():
            if item.is_dir():
                shutil.copytree(src=item, dst=dest_dir / item.name)
            else:
                shutil.copy(src=item, dst=dest_dir / item.name)
        dest_db_file = dest_dir / _DB_FILE

        # Append the new column to existing analyses in v4 database
        with ExitStack() as exit_stack:
            dest_engine = exit_stack.enter_context(sql_engine_ctx(dest_db_file))
            schema_4.metadata.create_all(dest_engine)

            def add_column(
                engine: sqlalchemy.engine.Engine,
                table_name: str,
                column: Any,
            ) -> None:
                column_type = column.type.compile(engine.dialect)
                engine.execute(
                    f"ALTER TABLE {table_name} ADD COLUMN {column.key} {column_type}"
                )

            add_column(
                dest_engine,
                schema_4.analysis_table.name,
                schema_4.analysis_table.c.run_time_parameter_values_and_defaults,
            )
            add_column(
                dest_engine,
                schema_4.run_table.name,
                schema_4.run_table.c.run_time_parameters,
            )
