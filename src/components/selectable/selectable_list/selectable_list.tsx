import React, { Component, HTMLAttributes, ReactNode, memo } from 'react';
import classNames from 'classnames';
import { CommonProps } from '../../common';
import { htmlIdGenerator } from '../../../services';
import {
  EuiSelectableListItem,
  EuiSelectableListItemProps,
} from './selectable_list_item';
import { EuiHighlight } from '../../highlight';
import { EuiSelectableOption } from '../selectable_option';
import AutoSizer from 'react-virtualized-auto-sizer';
import {
  FixedSizeList,
  ListProps,
  ListChildComponentProps,
  areEqual,
} from 'react-window';

// Consumer Configurable Props via `EuiSelectable.listProps`
export type EuiSelectableOptionsListProps = CommonProps &
  HTMLAttributes<HTMLDivElement> & {
    /**
     * The index of the option to be highlighted as pseudo-focused;
     * Good for use when only one selection is allowed and needing to open
     * directly to that option
     */
    activeOptionIndex?: number;
    /**
     *  The height of each option in pixels. Defaults to `32`
     */
    rowHeight: number;
    /**
     * Show the check/cross selection indicator icons
     */
    showIcons?: boolean;
    singleSelection?: 'always' | boolean;
    /**
     * Any props to send specifically to the react-window `FixedSizeList`
     */
    windowProps?: ListProps;
    /**
     * Adds a border around the list to indicate the bounds;
     * Useful when the list scrolls, otherwise use your own container
     */
    bordered?: boolean;
  };

export type EuiSelectableListProps = EuiSelectableOptionsListProps & {
  /**
   * All possible options
   */
  options: EuiSelectableOption[];
  /**
   * Filtered options list (if applicable)
   */
  visibleOptions?: EuiSelectableOption[];
  /**
   * Search value to highlight on the option render
   */
  searchValue: string;
  /**
   * Returns the array of options with altered checked state
   */
  onOptionClick: (options: EuiSelectableOption[]) => void;
  /**
   * Custom render for the label portion of the option;
   * Takes (option, searchValue), returns ReactNode
   */
  renderOption?: (
    option: EuiSelectableOption,
    searchValue: string
  ) => ReactNode;
  /**
   * Sets the max height in pixels or pass `full` to allow
   * the whole group to fill the height of its container and
   * allows the list grow as well
   */
  height?: number | 'full';
  /**
   * Allow cycling through the on, off and undefined state of option.checked
   * and not just on and undefined
   */
  allowExclusions?: boolean;
  rootId?: (appendix?: string) => string;
  searchable?: boolean;
};

export class EuiSelectableList extends Component<EuiSelectableListProps> {
  static defaultProps = {
    rowHeight: 32,
    searchValue: '',
  };

  rootId = this.props.rootId || htmlIdGenerator();
  listRef: FixedSizeList | null = null;
  listBoxRef: HTMLUListElement | null = null;

  makeOptionId(index: number | undefined) {
    if (typeof index === 'undefined') {
      return '';
    }

    return this.rootId(`_option-${index}`);
  }

  setListRef = (ref: FixedSizeList | null) => {
    this.listRef = ref;

    if (ref && this.props.activeOptionIndex) {
      ref.scrollToItem(this.props.activeOptionIndex, 'auto');
    }
  };

  setListBoxRef = (ref: HTMLUListElement | null) => {
    this.listBoxRef = ref;

    if (ref) {
      ref.setAttribute('id', this.rootId('listbox'));
      ref.setAttribute('role', 'listBox');

      if (this.props.searchable !== true) {
        ref.setAttribute('tabindex', '0');
      }

      if (
        this.props.singleSelection !== 'always' &&
        this.props.singleSelection !== true
      ) {
        ref.setAttribute('aria-multiselectable', 'true');
      }
    }
  };

  componentDidUpdate() {
    const { activeOptionIndex } = this.props;

    if (this.listBoxRef) {
      this.listBoxRef.setAttribute(
        'aria-activedescendant',
        `${this.makeOptionId(activeOptionIndex)}`
      );
    }

    if (this.listRef && typeof this.props.activeOptionIndex !== 'undefined') {
      this.listRef.scrollToItem(this.props.activeOptionIndex, 'auto');
    }
  }

  constructor(props: EuiSelectableListProps) {
    super(props);
  }

  ListRow = memo(({ data, index, style }: ListChildComponentProps) => {
    const option = data[index];
    const {
      label,
      isGroupLabel,
      checked,
      disabled,
      prepend,
      append,
      ref,
      key,
      ...optionRest
    } = option;

    if (isGroupLabel) {
      return (
        <li
          role="presentation"
          className="euiSelectableList__groupLabel"
          style={style}
          {...optionRest as HTMLAttributes<HTMLLIElement>}>
          {prepend}
          {label}
          {append}
        </li>
      );
    }

    return (
      <EuiSelectableListItem
        id={this.makeOptionId(index)}
        style={style}
        key={key || label.toLowerCase()}
        onClick={() => this.onAddOrRemoveOption(option)}
        ref={ref ? ref.bind(null, index) : undefined}
        isFocused={this.props.activeOptionIndex === index}
        title={label}
        showIcons={this.props.showIcons}
        checked={checked}
        disabled={disabled}
        prepend={prepend}
        append={append}
        {...optionRest as EuiSelectableListItemProps}>
        {this.props.renderOption ? (
          this.props.renderOption(option, this.props.searchValue)
        ) : (
          <EuiHighlight search={this.props.searchValue}>{label}</EuiHighlight>
        )}
      </EuiSelectableListItem>
    );
  }, areEqual);

  render() {
    const {
      className,
      options,
      searchValue,
      onOptionClick,
      renderOption,
      height: forcedHeight,
      windowProps,
      rowHeight,
      activeOptionIndex,
      rootId,
      showIcons,
      singleSelection,
      visibleOptions,
      allowExclusions,
      bordered,
      searchable,
      ...rest
    } = this.props;

    const optionArray = visibleOptions || options;

    const heightIsFull = forcedHeight === 'full';

    let calculatedHeight = (heightIsFull ? false : forcedHeight) as
      | false
      | number
      | undefined;

    // If calculatedHeight is still undefined, then calculate it
    if (calculatedHeight === undefined) {
      const maxVisibleOptions = 7;
      const numVisibleOptions = optionArray.length;
      const numVisibleMoreThanMax = optionArray.length > maxVisibleOptions;

      if (numVisibleMoreThanMax) {
        // Show only half of the last one to indicate there's more to scroll to
        calculatedHeight = (maxVisibleOptions - 0.5) * rowHeight;
      } else {
        calculatedHeight = numVisibleOptions * rowHeight;
      }
    }

    const classes = classNames(
      'euiSelectableList',
      {
        'euiSelectableList-fullHeight': heightIsFull,
        'euiSelectableList-bordered': bordered,
      },
      className
    );

    return (
      <div className={classes} {...rest}>
        <AutoSizer disableHeight={!heightIsFull}>
          {({ width, height }) => (
            <FixedSizeList
              ref={this.setListRef}
              className="euiSelectableList__list"
              width={width}
              height={calculatedHeight || height}
              itemCount={optionArray.length}
              itemData={optionArray}
              itemSize={rowHeight}
              innerElementType="ul"
              innerRef={this.setListBoxRef}
              {...windowProps}>
              {this.ListRow}
            </FixedSizeList>
          )}
        </AutoSizer>
      </div>
    );
  }

  onAddOrRemoveOption = (option: EuiSelectableOption) => {
    if (option.disabled) {
      return;
    }

    const { allowExclusions } = this.props;

    if (option.checked === 'on' && allowExclusions) {
      this.onExcludeOption(option);
    } else if (option.checked === 'on' || option.checked === 'off') {
      this.onRemoveOption(option);
    } else {
      this.onAddOption(option);
    }
  };

  private onAddOption = (addedOption: EuiSelectableOption) => {
    const { onOptionClick, options, singleSelection } = this.props;

    const updatedOptions = options.map(option => {
      // if singleSelection is enabled, uncheck any selected option(s)
      const updatedOption = { ...option };
      if (singleSelection) {
        delete updatedOption.checked;
      }

      // if this is the now-selected option, check it
      if (option === addedOption) {
        updatedOption.checked = 'on';
      }

      return updatedOption;
    });

    onOptionClick(updatedOptions);
  };

  private onRemoveOption = (removedOption: EuiSelectableOption) => {
    const { onOptionClick, singleSelection, options } = this.props;

    const updatedOptions = options.map(option => {
      const updatedOption = { ...option };

      if (option === removedOption && singleSelection !== 'always') {
        delete updatedOption.checked;
      }

      return updatedOption;
    });

    onOptionClick(updatedOptions);
  };

  private onExcludeOption = (excludedOption: EuiSelectableOption) => {
    const { onOptionClick, options } = this.props;
    excludedOption.checked = 'off';

    const updatedOptions = options.map(option => {
      const updatedOption = { ...option };

      if (option === excludedOption) {
        updatedOption.checked = 'off';
      }

      return updatedOption;
    });

    onOptionClick(updatedOptions);
  };
}
