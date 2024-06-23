"""Model for the screens of protocol upload v5dot1."""

from typing import Optional

from rich.console import Console
from selenium.webdriver.chrome.webdriver import WebDriver
from selenium.webdriver.common.by import By
from selenium.webdriver.remote.webelement import WebElement

from automation.driver.base import Base, Element
from automation.driver.wait import wait_until_none


class ProtocolLanding:
    """Class for Protocol landing page."""

    def __init__(self, driver: WebDriver, console: Console, execution_id: str) -> None:
        """Initialize with driver."""
        self.base: Base = Base(driver, console, execution_id)
        self.console: Console = console

    def get_choose_file_button(self) -> WebElement:
        """Get the choose file button on Protocol Page."""
        header: Element = Element(
            (By.ID, "UploadInput_protocolUploadButton"),
            "the choose file button on Protocol Page",
        )
        return self.base.clickable_wrapper(header, 5)

    def get_drag_drop_file_button(self) -> WebElement:
        """Get the drag and drop file button on Protocol Page."""
        header: Element = Element(
            (By.XPATH, '//label[@data-testid="file_drop_zone"]'),
            "the drag and drop file button on Protocol Page",
        )
        return self.base.present_wrapper(header, 4)

    def get_protocol_library_link(self) -> WebElement:
        """Get the Protocol Library Link on Protocol Page."""
        header: Element = Element(
            (By.ID, "EmptyStateLinks_protocolLibraryButton"),
            "the Protocol Library Link on Protocol Page.",
        )
        return self.base.present_wrapper(header, 2)

    def get_protocol_designer_link(self) -> WebElement:
        """Get the Protocol Designer Link on Protocol Page."""
        header: Element = Element(
            (By.ID, "EmptyStateLinks_protocolDesignerButton"),
            "the Protocol Designer Link on Protocol Page.",
        )
        return self.base.present_wrapper(header, 2)

    def get_python_api_link(self) -> WebElement:
        """Get the python api Link on Protocol Page."""
        header: Element = Element(
            (By.ID, "EmptyStateLinks_apiDocsButton"),
            "the python api Link on Protocol Page.",
        )
        return self.base.present_wrapper(header, 2)

    def get_show_in_folder(self) -> WebElement:
        """Get show in folder in overflow button on Protocol Page."""
        header: Element = Element(
            (By.XPATH, "//button[@data-testid='ProtocolOverflowMenu_showInFolder']"),
            "show in folder in overflow button on Protocol Page.",
        )
        return self.base.present_wrapper(header, 2)

    def get_run_protocol(self) -> WebElement:
        """Get run in overflow button on Protocol Page."""
        header: Element = Element(
            (By.XPATH, "//button[@data-testid='ProtocolOverflowMenu_run']"),
            "run in overflow button on Protocol Page.",
        )
        return self.base.present_wrapper(header, 2)

    def get_delete_protocol(self) -> WebElement:
        """Get delete protocol in overflow button on Protocol Page."""
        header: Element = Element(
            (By.XPATH, "//button[@data-testid='ProtocolOverflowMenu_deleteProtocol']"),
            "delete protocol in overflow button on Protocol Page.",
        )
        return self.base.present_wrapper(header, 2)

    def get_delete_protocol_confirm(self) -> WebElement:
        """Get delete protocol in overflow button on popout."""
        header: Element = Element(
            (By.XPATH, '//button[text()="Yes, delete protocol"]'),
            "delete protocol confirm button.",
        )
        return self.base.clickable_wrapper(header, 3)

    def get_import_button_protocol_landing(self) -> WebElement:
        """Get the import button on Protocol Landing Page."""
        header: Element = Element(
            (By.XPATH, '//button[text()="Import"]'),
            "the import button on Protocol Landing Page.",
        )
        return self.base.present_wrapper(header, 4)

    def get_deckMap_protocol_landing(self, protocol_name: str) -> WebElement:
        """Get the deckmap on Protocol Landing Page."""
        header: Element = Element(
            (
                By.XPATH,
                f"//div[@data-testid='ProtocolCard_deckLayout_{protocol_name}']",
            ),
            "the deckmap on Protocol Landing Page.",
        )
        return self.base.clickable_wrapper(header, 7)

    def get_protocol_name_text_protocol_landing(self, protocol_name: str) -> str:
        """Get the protocol name on Protocol Landing Page."""
        header: Element = Element(
            (
                By.XPATH,
                f'//h3[@data-testid="ProtocolCard_{protocol_name}"]',
            ),
            "the protocol name on Protocol Landing Page.",
        )
        element = self.base.clickable_wrapper(header, 4)
        if not element:
            return ""
        return element.text

    def get_left_mount_text_protocol_landing(self) -> str:
        """Get the left mount on Protocol Landing Page."""
        header: Element = Element(
            (
                By.XPATH,
                '//div[@data-testid="ProtocolCard_leftMount_script_pur_sample_1"]//h6',
            ),
            "the left mount on Protocol Landing Page.",
        )
        element = self.base.present_wrapper(header, 4)
        if not element:
            return ""
        return element.text

    def get_left_mount_value_protocol_landing(self) -> str:
        """Get the left mount value on Protocol Landing Page."""
        header: Element = Element(
            (
                By.XPATH,
                '//div[@data-testid="ProtocolCard_leftMount_script_pur_sample_1"]//p',
            ),
            "the left mount value on Protocol Landing Page.",
        )
        return self.base.present_wrapper(header, 1).text

    def get_right_mount_text_protocol_landing(self) -> str:
        """Get the right mount on Protocol Landing Page."""
        header: Element = Element(
            (
                By.XPATH,
                '//div[@data-testid="ProtocolCard_rightMount_script_pur_sample_1"]//h6',
            ),
            "the right mount on Protocol Landing Page.",
        )
        return self.base.present_wrapper(header, 1).text

    def get_right_mount_value_protocol_landing(self) -> str:
        """Get the right mount value on Protocol Landing Page."""
        header: Element = Element(
            (
                By.XPATH,
                '//div[@data-testid="ProtocolCard_rightMount_script_pur_sample_1"]//p',
            ),
            "the right mount value on Protocol Landing Page.",
        )
        return self.base.present_wrapper(header, 1).text

    def get_mag_module_protocol_landing(self) -> WebElement:
        """Get the mag module on Protocol Landing Page."""
        header: Element = Element(
            (By.XPATH, '//*[@data-testid="ModuleIcon_ot-magnet-v2"]'),
            "the mag module on Protocol Landing Page.",
        )
        return self.base.present_wrapper(header, 1)

    def get_temp_module_protocol_landing(self) -> WebElement:
        """Get the temp module on Protocol Landing Page."""
        header: Element = Element(
            (By.XPATH, '//*[@data-testid="ModuleIcon_ot-temperature-v2"]'),
            "the temp module on Protocol Landing Page.",
        )
        return self.base.present_wrapper(header, 1)

    def get_thermocycler_module_protocol_landing(self) -> WebElement:
        """Get the thermocycler module on Protocol Landing Page."""
        header: Element = Element(
            (By.XPATH, '//*[@data-testid="ModuleIcon_ot-thermocycler"]'),
            "the thermocycler module on Protocol Landing Page.",
        )
        return self.base.present_wrapper(header, 1)

    def get_updated_timestamp_protocol_landing(self) -> WebElement:
        """Get the updated timestamp module on Protocol Landing Page."""
        header: Element = Element(
            (By.XPATH, '//div[@data-testid="ProtocolCard_date_script_pur_sample_1"]'),
            "the updated timestamp on Protocol Landing Page.",
        )
        return self.base.present_wrapper(header, 1)

    def click_protocol_card(self) -> None:
        """Get the protocol card."""
        card: Element = Element(
            (By.XPATH, '//h3[@data-testid="ProtocolCard_script_pur_sample_1"]'),
            "protocol card",
        )
        self.base.click(card)

    def protocol_list_parents(self) -> Element:
        """The parent row div on the protocol landing page."""
        return Element(
            (By.XPATH, '//div[contains(@class, "ProtocolCard___StyledBox")]'),
            "protocol parent rows",
        )

    def get_protocol_list_parents(self) -> list[WebElement]:
        return self.base.finds_wrapper(self.protocol_list_parents())

    def delete_all_protocols(self) -> None:
        """Delete every protocol."""
        for _protocol in self.get_protocol_list_parents():
            self.click_overflow_menu()
            self.base.click_webelement(self.get_delete_protocol())
            self.base.click_webelement(self.get_delete_protocol_confirm())

    def click_overflow_menu(self) -> None:
        """Get the overflow menu on protocol landing page."""
        card: Element = Element(
            (
                By.XPATH,
                '//button[@data-testid="ProtocolOverflowMenu_overflowBtn"]',
            ),
            "protocol card",
        )
        self.base.click(card)

    def get_creation_method_text_protocol_detail(self) -> str:
        """Get the creation method text on Protocol Detail Page."""
        header: Element = Element(
            (
                By.XPATH,
                '//div[@data-testid="ProtocolDetails_creationMethod"]//h6',
            ),
            "the creation method text on Protocol Detail Page.",
        )
        return self.base.present_wrapper(header, 2).text

    def get_creation_method_value_protocol_detail(self) -> str:
        """Get the creation method text on Protocol Detail Page."""
        header: Element = Element(
            (
                By.XPATH,
                '//div[@data-testid="ProtocolDetails_creationMethod"]//p',
            ),
            "the creation method text on Protocol Detail Page.",
        )
        return self.base.present_wrapper(header, 1).text

    def get_last_updated_text_protocol_detail(self) -> str:
        """Get the last updated text on Protocol Detail Page."""
        header: Element = Element(
            (
                By.XPATH,
                '//div[@data-testid="ProtocolDetails_lastUpdated"]//h6',
            ),
            "the last updated text on Protocol Detail Page.",
        )
        return self.base.present_wrapper(header, 1).text

    def get_last_updated_value_protocol_detail(self) -> WebElement:
        """Get the last updated value on Protocol Detail Page."""
        header: Element = Element(
            (
                By.XPATH,
                '//div[@data-testid="ProtocolDetails_lastUpdated"]//p',
            ),
            "the last update value on Protocol Detail Page.",
        )
        return self.base.present_wrapper(header, 1)

    def get_last_analyzed_text_protocol_detail(self) -> str:
        """Get the last analyzed text on Protocol Detail Page."""
        header: Element = Element(
            (
                By.XPATH,
                '//div[@data-testid="ProtocolDetails_lastAnalyzed"]//h6',
            ),
            "the last analyzed text on Protocol Detail Page.",
        )
        return self.base.present_wrapper(header, 1).text

    def get_last_analyzed_value_protocol_detail(self) -> WebElement:
        """Get the last analyzed value on Protocol Detail Page."""
        header: Element = Element(
            (
                By.XPATH,
                '//div[@data-testid="ProtocolDetails_lastAnalyzed"]//p',
            ),
            "the last analyzed value on Protocol Detail Page.",
        )
        return self.base.present_wrapper(header, 1)

    def get_author_text_protocol_detail(self) -> str:
        """Get the author text on Protocol Detail Page."""
        header: Element = Element(
            (
                By.XPATH,
                '//div[@data-testid="ProtocolDetails_author"]//h6',
            ),
            "the author text on Protocol Detail Page.",
        )
        return self.base.present_wrapper(header, 2).text

    def get_author_value_protocol_detail(self) -> str:
        """Get the author text on Protocol Detail Page."""
        header: Element = Element(
            (
                By.XPATH,
                '//div[@data-testid="ProtocolDetails_author"]//p',
            ),
            "the author text on Protocol Detail Page.",
        )
        return self.base.present_wrapper(header, 1).text

    def get_description_text_protocol_detail(self) -> WebElement:
        """Get the description text on Protocol Detail Page."""
        header: Element = Element(
            (
                By.XPATH,
                '//div[@data-testid="ProtocolDetails_description"]//p',
            ),
            "the description text on Protocol Detail Page.",
        )
        return self.base.present_wrapper(header, 1)

    def get_deckmap_protocol_detail(self) -> WebElement:
        """Get the deckmap on Protocol Detail Page."""
        header: Element = Element(
            (
                By.XPATH,
                '//*[@data-testid="ProtocolDetails_deckMap"]',
            ),
            "the deckmap on Protocol Detail Page.",
        )
        return self.base.present_wrapper(header, 1)

    def get_robot_configuration_protocol_detail(self) -> str:
        """Get the robot configuration text on Protocol Detail Page."""
        header: Element = Element(
            (
                By.XPATH,
                '//*[@data-testid="ProtocolDetails_robotConfig"]//p',
            ),
            "the robot configuration text on Protocol Detail Page.",
        )
        return self.base.present_wrapper(header, 1).text

    def get_labware_tab_protocol_detail(self) -> str:
        """Get the labware text on Protocol Detail Page."""
        header: Element = Element(
            (
                By.XPATH,
                '//div[@data-testid="ProtocolDetails_labware"]//p',
            ),
            "the labware text on Protocol Detail Page.",
        )
        return self.base.present_wrapper(header, 1).text

    def get_left_mount_protocol_detail(self) -> WebElement:
        """Get the left mount on Protocol Detail Page."""
        header: Element = Element(
            (
                By.XPATH,
                '//*[@data-testid="RobotConfigurationDetails_left mount"]',
            ),
            "the left mount on Protocol Detail Page.",
        )
        return self.base.present_wrapper(header, 1)

    def get_right_mount_protocol_detail(self) -> WebElement:
        """Get the right mount on Protocol Detail Page."""
        header: Element = Element(
            (
                By.XPATH,
                '//*[@data-testid="RobotConfigurationDetails_right mount"]',
            ),
            "the right mount on Protocol Detail Page.",
        )
        return self.base.present_wrapper(header, 1)

    def get_mag_mod_protocol_detail(self) -> WebElement:
        """Get the mag module on Protocol Detail Page."""
        header: Element = Element(
            (
                By.XPATH,
                '//*[@data-testid="ModuleIcon_ot-magnet-v2"]',
            ),
            "the mag module on Protocol Detail Page.",
        )
        return self.base.present_wrapper(header, 1)

    def get_temp_mod_protocol_detail(self) -> WebElement:
        """Get the temp module on Protocol Detail Page."""
        header: Element = Element(
            (
                By.XPATH,
                '//*[@data-testid="ModuleIcon_ot-temperature-v2"]',
            ),
            "the temp module on Protocol Detail Page.",
        )
        return self.base.present_wrapper(header, 1)

    def get_close_button_uncurrent_run(self) -> WebElement:
        """Get the close button on success banner Page."""
        header: Element = Element(
            (
                By.XPATH,
                '//*[@data-testid="Banner_close-button"]',
            ),
            "the close button on success banner.",
        )
        return self.base.present_wrapper(header, 1)

    def get_thermocycler_mod_protocol_detail(self) -> WebElement:
        """Get the thermocycler module on Protocol Detail Page."""
        header: Element = Element(
            (
                By.XPATH,
                '//*[@data-testid="ModuleIcon_ot-thermocycler"]',
            ),
            "the thermocycler module on Protocol Detail Page.",
        )
        return self.base.present_wrapper(header, 1)

    def click_run_protocol_on_protocol_detail(self) -> None:
        """Get the run protocol on Protocol Detail Page."""
        button: Element = Element(
            (
                By.XPATH,
                '//button[@data-testid="ProtocolDetails_runProtocol"]',
            ),
            "the run protocol on Protocol Detail Page.",
        )
        self.base.click(button)

    def click_run_on_protocol_landing(self) -> None:
        """Get the run protocol on Protocol Landing Page."""
        button: Element = Element(
            (
                By.XPATH,
                '//button[@data-testid="ProtocolOverflowMenu_run"]',
            ),
            "the run protocol on Protocol Landing Page.",
        )
        self.base.click(button)

    def get_slideout_header_on_protocol_detail(self) -> WebElement:
        """Get the slideout header on Protocol Detail Page."""
        header: Element = Element(
            (
                By.TAG_NAME,
                "h2",
            ),
            "the slideout header on Protocol Detail Page.",
        )
        return self.base.present_wrapper(header, 1)

    def click_proceed_to_setup_on_protocol_detail(self) -> None:
        """Get the proceed to setup on Protocol Detail Page."""
        button: Element = Element(
            (
                By.XPATH,
                '//button[text()="Proceed to setup"]',
            ),
            "the proceed to setup on Protocol Detail Page.",
        )
        self.base.click(button)

    def click_robot_on_protocol_detail(self) -> None:
        """Protocol Detail Page robot."""
        button: Element = Element(
            (
                By.TAG_NAME,
                "h6",
            ),
            "the robot on Protocol Detail Page.",
        )
        self.base.click(button)

    def click_close_button_uncurrent_run(self) -> None:
        """Click close button."""
        button: Element = Element(
            (
                By.XPATH,
                '//*[@data-testid="Banner_close-button"]',
            ),
            "click close button.",
        )
        self.base.click(button)

    def loading_data(self) -> Element:
        """Element locator for the spinner that appears when a protocol is analyzing."""
        return Element(
            (
                By.XPATH,
                '//p[text()="Loading data..."]',
            ),
            "Loading data... that appears when a protocol is analyzing",
        )

    def get_loading_data_safe(self) -> Optional[WebElement]:
        """Get loading data."""
        ptext: Optional[WebElement] = self.base.present_wrapper_safe(self.loading_data(), 1)
        if ptext is None:
            self.console.print("Loading data... NOT found!", style="white on blue")
        else:
            self.console.print("Loading data... found!", style="white on blue")
        return ptext

    def wait_until_loading_data_gone(self, timeout_sec: int = 61) -> bool:
        """Wait for loading data to go away."""
        return wait_until_none(self.get_loading_data_safe, timeout_sec=timeout_sec)

    def error_details(self) -> Element:
        """Element locator for the link to the protocol analysis error details."""
        return Element(
            (
                By.XPATH,
                '//a[text()="error details"]',
            ),
            "error details button",
        )

    def get_error_details_safe(self) -> Optional[WebElement]:
        """Get error details link."""
        error_details: Optional[WebElement] = self.base.present_wrapper_safe(self.error_details(), 2)
        if error_details is None:
            self.console.print("No errors in the protocol analysis.", style="bright_yellow on blue")
        else:
            self.console.print("Errors in protocol analysis.", style="bright_yellow on blue")
        return error_details

    def reanalyze_link(self) -> Element:
        """Element locator for the reanalyze link when there is an error."""
        return Element(
            (
                By.XPATH,
                '//a[text()="Reanalyze"]',
            ),
            "Reanalyze button",
        )

    def popout_error_p(self) -> Element:
        """Element locator for the analysis error details."""
        return Element(
            (
                By.XPATH,
                "//div[@type='error']//p",
            ),
            "popout analysis error text",
        )

    def get_popout_error(self) -> WebElement:
        """Get the popout error element."""
        return self.base.present_wrapper(self.popout_error_p())

    def popout_close(self) -> Element:
        """Popout close button."""
        return Element(
            (By.XPATH, "//button[text()='close']"),
            "close button",
        )

    def click_popout_close(self) -> None:
        """Click the popout close button."""
        self.base.click(self.popout_close())


# data-testid="ModalHeader_icon_close_Protocol analysis failure."
