For more details about this release, please see the full [technical change log][]. 

[technical change log]: https://github.com/Opentrons/opentrons/releases

## Internal Release 1.5.0-alpha.1

This internal release is from the `edge` branch to contain rapid dev on new features for 7.3.0. This release is for internal testing purposes and if used may require a factory reset of the robot to return to a stable version.

<https://github.com/Opentrons/opentrons/compare/ot3@1.5.0-alpha.0...ot3@1.5.0-alpha.1>

---

## Internal Release 1.5.0-alpha.0

This internal release is from the `edge` branch to contain rapid dev on new features for 7.3.0. This release is for internal testing purposes and if used may require a factory reset of the robot to return to a stable version.

<https://github.com/Opentrons/opentrons/compare/ot3@1.4.0-alpha.1...ot3@1.5.0-alpha.0>

---

## Internal Release 1.4.0-alpha.1

This internal release is from the `edge` branch to contain rapid dev on new features for 7.3.0. This release is for internal testing purposes and if used may require a factory reset of the robot to return to a stable version.

This release is primarily to unblock Flex runs.  That fix is in <https://github.com/Opentrons/ot3-firmware/pull/769>

### All changes

<https://github.com/Opentrons/opentrons/compare/ot3@1.4.0-alpha.0...ot3@1.4.0-alpha.1>

---

## Internal Release 1.4.0-alpha.0

This internal release is from the `edge` branch to contain rapid dev on new features for 7.3.0. This release is for internal testing purposes and if used may require a factory reset of the robot to return to a stable version.

<https://github.com/Opentrons/opentrons/compare/ot3@1.3.0-alpha.0...ot3@1.4.0-alpha.0>

---

## Internal Release 1.3.0-alpha.0

This internal release is from the `edge` branch to contain rapid dev on new features for 7.3.0. This release is for internal testing purposes and if used may require a factory reset of the robot to return to a stable version.

<https://github.com/Opentrons/opentrons/compare/v7.2.2...ot3@1.3.0-alpha.0>

---

# Internal Release 1.1.0

## New Stuff In This Release

This is a tracking internal release coming off of the edge branch to contain rapid dev on new features for 7.1.0. Features will change drastically between successive alphas even over the course of the day. For this reason, these release notes will not be in their usual depth.

The biggest new features, however, are
- There is a new protocol API version, 2.16, which changes how the default trash is loaded and gates features like partial tip pickup and waste chute usage:
  - Protocols do not load a trash by default. To load the normal trash, load ``opentrons_1_trash_3200ml_fixed`` in slot ``A3``.
    - But also you can load it in any other edge slot if you want (columns 1 and 3).
  - Protocols can load trash chutes; the details of exactly how this works are still in flux.
  - Protocols can configure their 96 and 8 channel pipettes to pick up only a subset of tips using ``configure_nozzle_layout``.
- Support for json protocol V8 and command V8, which adds JSON protocol support for the above features.
- ODD support for rendering the above features in protocols
- ODD support for configuring the loaded deck fixtures like trash chutes
- Labware position check now uses the calibration probe (the same one used for pipette and module calibration) instead of a tip; this should increase the accuracy of LPC.
- Support for P1000S v3.6
- Updated liquid handling functions for all 96 channel pipettes

## Known Issues 

- The ``MoveToAddressableArea`` command will noop. This means that all commands that use the movable trash bin will not "move to the trash bin". The command will analyze successfully.
- The deck configuration on the robot is not persistent, this means that between boots of a robot, you must PUT a deck configuration on the robot via HTTP.

## Other changes

- Protocol engine now does not allow loading any items in locations (whether deck slot/ module/ adapter) that are already occupied. 
Previously there were gaps in our checks for this in the API. Also, one could write HTTP/ JSON protocols (not PD generated) that loaded multiple items in a given location. Protocols were most likely exploiting this loophole to perform labware movement prior to DSM support. They should now use the correct labware movement API instead.
