:og:description: Access parameter values in Opentrons Python protocols.

.. _using-rtp:

****************
Using Parameters
****************

Once you've :ref:`defined parameters <defining-rtp>`, their values are accessible anywhere within the ``run()`` function of your protocol.

The ``params`` Object
=====================

Protocols with parameters have a :py:obj:`.ProtocolContext.params` object, which contains the values of all parameters as set during run setup. Each attribute of ``params`` corresponds to the ``variable_name`` of a parameter.

For example, consider a protocol that defines the following three parameters:

- ``add_bool`` with ``variable_name="dry_run"``
- ``add_int`` with ``variable_name="sample_count"``
- ``add_float`` with ``variable_name="volume"``

Then ``params`` will gain three attributes: ``params.dry_run``, ``params.sample_count``, and ``params.volume``. You can use these attributes anywhere you want to access their values, including directly as arguments of methods.

.. code-block::

    if protocol.params.dry_run is False:
        pipette.mix(repetitions=10, volume=protocol.params.volume)

You can also save parameter values to variables with names of your choosing.

Parameter Types
===============

Each attribute of ``params`` has the type corresponding to its parameter definition. Keep in mind the parameter's type when using its value in different contexts.

Say you wanted to add a comment to the run log, stating how many samples the protocol will process. Since ``sample_count`` is an ``int``, you'll need to cast it to a ``str`` or the API will raise an error.

.. code-block::

    protocol.comment(
        "Processing " + str(protocol.params.sample_count) + " samples."
    )

Also be careful with ``int`` types when performing calculations: dividing an ``int`` by an ``int`` with the ``/`` operator always produces a ``float``, even if there is no remainder. The :ref:`sample count use case <use-case-sample-count>` converts a sample count to a column count by dividing by 8 — but it uses the ``//`` integer division operator, so the result can be used for creating ranges, slicing lists, and as ``int`` argument values without having to cast it in those contexts.

Limitations
===========

Since ``params`` is only available within the ``run()`` function, there are certain aspects of a protocol that parameter values can't affect. These include, but are not limited to the following:


.. list-table::
    :header-rows: 1

    * - Information
      - Location
    * - ``import`` statements
      - At the beginning of the protocol.
    * - Robot type (Flex or OT-2)
      - In the ``requirements`` dictionary.
    * - API version
      - In the ``requirements`` or ``metadata`` dictionary.
    * - Protocol name
      - In the ``metadata`` dictionary.
    * - Protocol description
      - In the ``metadata`` dictionary.
    * - Protocol author
      - In the ``metadata`` dictionary.
    * - Other runtime parameters
      - In the ``add_parameters()`` function.
    * - Non-nested function definitions
      - Anywhere outside of ``run()``.

Additionally, keep in mind that updated parameter values are applied by reanalyzing the protocol. This means you can't depend on updated values for any action that takes place *prior to reanalysis*.

An example of such an action is applying labware offset data. Say you have a parameter that changes the type of well plate you load in a particular slot::

    # within add_parameters()
    parameters.add_str(
        variable_name="plate_type",
        display_name="Well plate type",
        choices=[
            {"display_name": "Corning", "value": "corning_96_wellplate_360ul_flat"},
            {"display_name": "NEST", "value": "nest_96_wellplate_200ul_flat"},
        ],
        default="corning_96_wellplate_360ul_flat",
    )

    # within run()
    plate = protocol.load_labware(
        load_name="protocol.params.plate_type", location="D2"
    )

When performing run setup, you're prompted to apply offsets before selecting parameter values. This is your only opportunity to apply offsets, so they're applied for the default parameter values — in this case, the Corning plate. If you then change the "Well plate type" parameter to the NEST plate, the NEST plate will have default offset values (0.0 on all axes). You can fix this by running Labware Position Check, since it takes place after reanalysis, or by using :py:meth:`.Labware.set_offset` in your protocol.
