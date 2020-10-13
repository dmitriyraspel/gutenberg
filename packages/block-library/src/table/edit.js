/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useEffect, useState } from '@wordpress/element';
import {
	InspectorControls,
	BlockControls,
	RichText,
	PanelColorSettings,
	createCustomColorsHOC,
	BlockIcon,
	AlignmentToolbar,
	useBlockProps,
} from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';
import {
	Button,
	DropdownMenu,
	PanelBody,
	Placeholder,
	TextControl,
	ToggleControl,
	ToolbarGroup,
	ToolbarItem,
} from '@wordpress/components';
import {
	alignLeft,
	alignRight,
	alignCenter,
	blockTable as icon,
	tableColumnAfter,
	tableColumnBefore,
	tableColumnDelete,
	tableRowAfter,
	tableRowBefore,
	tableRowDelete,
	table,
} from '@wordpress/icons';
import { createBlock } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import {
	createTable,
	updateSelectedCell,
	getCellAttribute,
	insertRow,
	deleteRow,
	insertColumn,
	deleteColumn,
	toggleSection,
	isEmptyTableSection,
} from './state';

const BACKGROUND_COLORS = [
	{
		color: '#f3f4f5',
		name: 'Subtle light gray',
		slug: 'subtle-light-gray',
	},
	{
		color: '#e9fbe5',
		name: 'Subtle pale green',
		slug: 'subtle-pale-green',
	},
	{
		color: '#e7f5fe',
		name: 'Subtle pale blue',
		slug: 'subtle-pale-blue',
	},
	{
		color: '#fcf0ef',
		name: 'Subtle pale pink',
		slug: 'subtle-pale-pink',
	},
];

const ALIGNMENT_CONTROLS = [
	{
		icon: alignLeft,
		title: __( 'Align column left' ),
		align: 'left',
	},
	{
		icon: alignCenter,
		title: __( 'Align column center' ),
		align: 'center',
	},
	{
		icon: alignRight,
		title: __( 'Align column right' ),
		align: 'right',
	},
];

const withCustomBackgroundColors = createCustomColorsHOC( BACKGROUND_COLORS );

function TableEdit( {
	attributes,
	backgroundColor,
	setBackgroundColor,
	setAttributes,
	insertBlocksAfter,
	isSelected,
} ) {
	const { hasFixedLayout, caption, head, body, foot } = attributes;
	const [ initialRowCount, setInitialRowCount ] = useState( 2 );
	const [ initialColumnCount, setInitialColumnCount ] = useState( 2 );
	const [ selectedCell, setSelectedCell ] = useState();

	/**
	 * Updates the initial column count used for table creation.
	 *
	 * @param {number} count New initial column count.
	 */
	function onChangeInitialColumnCount( count ) {
		setInitialColumnCount( count );
	}

	/**
	 * Updates the initial row count used for table creation.
	 *
	 * @param {number} count New initial row count.
	 */
	function onChangeInitialRowCount( count ) {
		setInitialRowCount( count );
	}

	/**
	 * Creates a table based on dimensions in local state.
	 *
	 * @param {Object} event Form submit event.
	 */
	function onCreateTable( event ) {
		event.preventDefault();

		setAttributes(
			createTable( {
				rowCount: parseInt( initialRowCount, 10 ) || 2,
				columnCount: parseInt( initialColumnCount, 10 ) || 2,
			} )
		);
	}

	/**
	 * Toggles whether the table has a fixed layout or not.
	 */
	function onChangeFixedLayout() {
		setAttributes( { hasFixedLayout: ! hasFixedLayout } );
	}

	/**
	 * Changes the content of the currently selected cell.
	 *
	 * @param {Array} content A RichText content value.
	 */
	function onChange( content ) {
		if ( ! selectedCell ) {
			return;
		}

		setAttributes(
			updateSelectedCell(
				attributes,
				selectedCell,
				( cellAttributes ) => ( {
					...cellAttributes,
					content,
				} )
			)
		);
	}

	/**
	 * Align text within the a column.
	 *
	 * @param {string} align The new alignment to apply to the column.
	 */
	function onChangeColumnAlignment( align ) {
		if ( ! selectedCell ) {
			return;
		}

		// Convert the cell selection to a column selection so that alignment
		// is applied to the entire column.
		const columnSelection = {
			type: 'column',
			columnIndex: selectedCell.columnIndex,
		};

		const newAttributes = updateSelectedCell(
			attributes,
			columnSelection,
			( cellAttributes ) => ( {
				...cellAttributes,
				align,
			} )
		);
		setAttributes( newAttributes );
	}

	/**
	 * Get the alignment of the currently selected cell.
	 *
	 * @return {string} The new alignment to apply to the column.
	 */
	function getCellAlignment() {
		if ( ! selectedCell ) {
			return;
		}

		return getCellAttribute( attributes, selectedCell, 'align' );
	}

	/**
	 * Add or remove a `head` table section.
	 */
	function onToggleHeaderSection() {
		setAttributes( toggleSection( attributes, 'head' ) );
	}

	/**
	 * Add or remove a `foot` table section.
	 */
	function onToggleFooterSection() {
		setAttributes( toggleSection( attributes, 'foot' ) );
	}

	/**
	 * Inserts a row at the currently selected row index, plus `delta`.
	 *
	 * @param {number} delta Offset for selected row index at which to insert.
	 */
	function onInsertRow( delta ) {
		if ( ! selectedCell ) {
			return;
		}

		const { sectionName, rowIndex } = selectedCell;
		const newRowIndex = rowIndex + delta;

		setAttributes(
			insertRow( attributes, {
				sectionName,
				rowIndex: newRowIndex,
			} )
		);
		// Select the first cell of the new row
		setSelectedCell( {
			sectionName,
			rowIndex: newRowIndex,
			columnIndex: 0,
			type: 'cell',
		} );
	}

	/**
	 * Inserts a row before the currently selected row.
	 */
	function onInsertRowBefore() {
		onInsertRow( 0 );
	}

	/**
	 * Inserts a row after the currently selected row.
	 */
	function onInsertRowAfter() {
		onInsertRow( 1 );
	}

	/**
	 * Deletes the currently selected row.
	 */
	function onDeleteRow() {
		if ( ! selectedCell ) {
			return;
		}

		const { sectionName, rowIndex } = selectedCell;

		setSelectedCell();
		setAttributes( deleteRow( attributes, { sectionName, rowIndex } ) );
	}

	/**
	 * Inserts a column at the currently selected column index, plus `delta`.
	 *
	 * @param {number} delta Offset for selected column index at which to insert.
	 */
	function onInsertColumn( delta = 0 ) {
		if ( ! selectedCell ) {
			return;
		}

		const { columnIndex } = selectedCell;
		const newColumnIndex = columnIndex + delta;

		setAttributes(
			insertColumn( attributes, {
				columnIndex: newColumnIndex,
			} )
		);
		// Select the first cell of the new column
		setSelectedCell( {
			rowIndex: 0,
			columnIndex: newColumnIndex,
			type: 'cell',
		} );
	}

	/**
	 * Inserts a column before the currently selected column.
	 */
	function onInsertColumnBefore() {
		onInsertColumn( 0 );
	}

	/**
	 * Inserts a column after the currently selected column.
	 */
	function onInsertColumnAfter() {
		onInsertColumn( 1 );
	}

	/**
	 * Deletes the currently selected column.
	 */
	function onDeleteColumn() {
		if ( ! selectedCell ) {
			return;
		}

		const { sectionName, columnIndex } = selectedCell;

		setSelectedCell();
		setAttributes(
			deleteColumn( attributes, { sectionName, columnIndex } )
		);
	}

	useEffect( () => {
		if ( ! isSelected ) {
			setSelectedCell();
		}
	}, [ isSelected ] );

	const blockProps = useBlockProps();

	const isEmpty =
		isEmptyTableSection( head ) &&
		isEmptyTableSection( body ) &&
		isEmptyTableSection( foot );

	if ( isEmpty ) {
		return (
			<div { ...blockProps }>
				<Placeholder
					label={ __( 'Table' ) }
					icon={ <BlockIcon icon={ icon } showColors /> }
					instructions={ __( 'Insert a table for sharing data.' ) }
				>
					<form
						className="blocks-table__placeholder-form"
						onSubmit={ onCreateTable }
					>
						<TextControl
							type="number"
							label={ __( 'Column count' ) }
							value={ initialColumnCount }
							onChange={ onChangeInitialColumnCount }
							min="1"
							className="blocks-table__placeholder-input"
						/>
						<TextControl
							type="number"
							label={ __( 'Row count' ) }
							value={ initialRowCount }
							onChange={ onChangeInitialRowCount }
							min="1"
							className="blocks-table__placeholder-input"
						/>
						<Button
							className="blocks-table__placeholder-button"
							isPrimary
							type="submit"
						>
							{ __( 'Create Table' ) }
						</Button>
					</form>
				</Placeholder>
			</div>
		);
	}

	const tableControls = [
		{
			icon: tableRowBefore,
			title: __( 'Insert row before' ),
			isDisabled: ! selectedCell,
			onClick: onInsertRowBefore,
		},
		{
			icon: tableRowAfter,
			title: __( 'Insert row after' ),
			isDisabled: ! selectedCell,
			onClick: onInsertRowAfter,
		},
		{
			icon: tableRowDelete,
			title: __( 'Delete row' ),
			isDisabled: ! selectedCell,
			onClick: onDeleteRow,
		},
		{
			icon: tableColumnBefore,
			title: __( 'Insert column before' ),
			isDisabled: ! selectedCell,
			onClick: onInsertColumnBefore,
		},
		{
			icon: tableColumnAfter,
			title: __( 'Insert column after' ),
			isDisabled: ! selectedCell,
			onClick: onInsertColumnAfter,
		},
		{
			icon: tableColumnDelete,
			title: __( 'Delete column' ),
			isDisabled: ! selectedCell,
			onClick: onDeleteColumn,
		},
	];

	const tableClasses = classnames( backgroundColor.class, {
		'has-fixed-layout': hasFixedLayout,
		'has-background': !! backgroundColor.color,
	} );

	const sections = [ 'head', 'body', 'foot' ].map( ( name ) => {
		const rows = attributes[ name ];

		if ( isEmptyTableSection( rows ) ) {
			return null;
		}

		const Tag = `t${ name }`;

		return (
			<Tag key={ name }>
				{ rows.map( ( { cells }, rowIndex ) => (
					<tr key={ rowIndex }>
						{ cells.map(
							(
								{ content, tag: CellTag, scope, align },
								columnIndex
							) => {
								const cellLocation = {
									sectionName: name,
									rowIndex,
									columnIndex,
								};

								const cellClasses = classnames(
									{
										[ `has-text-align-${ align }` ]: align,
									},
									'wp-block-table__cell-content'
								);

								let placeholder = '';
								if ( name === 'head' ) {
									placeholder = __( 'Header label' );
								} else if ( name === 'foot' ) {
									placeholder = __( 'Footer label' );
								}

								return (
									<RichText
										tagName={ CellTag }
										key={ columnIndex }
										className={ cellClasses }
										scope={
											CellTag === 'th' ? scope : undefined
										}
										value={ content }
										onChange={ onChange }
										unstableOnFocus={ () => {
											setSelectedCell( {
												...cellLocation,
												type: 'cell',
											} );
										} }
										placeholder={ placeholder }
									/>
								);
							}
						) }
					</tr>
				) ) }
			</Tag>
		);
	} );

	return (
		<>
			<BlockControls>
				<ToolbarGroup>
					<ToolbarItem>
						{ ( toggleProps ) => (
							<DropdownMenu
								hasArrowIndicator
								icon={ table }
								toggleProps={ toggleProps }
								label={ __( 'Edit table' ) }
								controls={ tableControls }
							/>
						) }
					</ToolbarItem>
				</ToolbarGroup>
				<AlignmentToolbar
					label={ __( 'Change column alignment' ) }
					alignmentControls={ ALIGNMENT_CONTROLS }
					value={ getCellAlignment() }
					onChange={ ( nextAlign ) =>
						onChangeColumnAlignment( nextAlign )
					}
				/>
			</BlockControls>
			<InspectorControls>
				<PanelBody
					title={ __( 'Table settings' ) }
					className="blocks-table-settings"
				>
					<ToggleControl
						label={ __( 'Fixed width table cells' ) }
						checked={ !! hasFixedLayout }
						onChange={ onChangeFixedLayout }
					/>
					<ToggleControl
						label={ __( 'Header section' ) }
						checked={ !! ( head && head.length ) }
						onChange={ onToggleHeaderSection }
					/>
					<ToggleControl
						label={ __( 'Footer section' ) }
						checked={ !! ( foot && foot.length ) }
						onChange={ onToggleFooterSection }
					/>
				</PanelBody>
				<PanelColorSettings
					title={ __( 'Color settings' ) }
					initialOpen={ false }
					colorSettings={ [
						{
							value: backgroundColor.color,
							onChange: setBackgroundColor,
							label: __( 'Background color' ),
							disableCustomColors: true,
							colors: BACKGROUND_COLORS,
						},
					] }
				/>
			</InspectorControls>
			<figure { ...blockProps }>
				<table className={ tableClasses }>{ sections }</table>
				<RichText
					tagName="figcaption"
					placeholder={ __( 'Write caption…' ) }
					value={ caption }
					onChange={ ( value ) =>
						setAttributes( { caption: value } )
					}
					// Deselect the selected table cell when the caption is focused.
					unstableOnFocus={ () => setSelectedCell() }
					__unstableOnSplitAtEnd={ () =>
						insertBlocksAfter( createBlock( 'core/paragraph' ) )
					}
				/>
			</figure>
		</>
	);
}

export default withCustomBackgroundColors( 'backgroundColor' )( TableEdit );
