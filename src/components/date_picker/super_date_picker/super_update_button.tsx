import React, { Component, MouseEventHandler, Ref } from 'react';
import classNames from 'classnames';

import { EuiButton } from '../../button';
import { EuiI18n } from '../../i18n';
import { EuiToolTip, EuiToolTipProps } from '../../tool_tip';

export interface EuiSuperUpdateButtonProps {
  className?: string;
  isDisabled: boolean;
  isLoading: boolean;
  needsUpdate: boolean;
  onClick: MouseEventHandler<HTMLButtonElement>;

  /**
   * Passes props to `EuiToolTip`
   */
  toolTipProps?: EuiToolTipProps;

  /**
   * Show the "Click to apply" tooltip
   */
  showTooltip: boolean;
}

export class EuiSuperUpdateButton extends Component<EuiSuperUpdateButtonProps> {
  static defaultProps = {
    needsUpdate: false,
    isLoading: false,
    isDisabled: false,
    showTooltip: false,
  };

  _isMounted = false;
  tooltipTimeout: number | undefined;
  tooltip: EuiToolTip | null = null;

  componentWillUnmount() {
    this._isMounted = false;
  }

  componentDidMount() {
    this._isMounted = true;
  }

  componentDidUpdate() {
    if (
      this.props.showTooltip &&
      this.props.needsUpdate &&
      !this.props.isDisabled &&
      !this.props.isLoading
    ) {
      this.showTooltip();
      this.tooltipTimeout = (setTimeout(() => {
        this.hideTooltip();
      }, 2000) as unknown) as (number | undefined);
    }
  }

  setTootipRef: Ref<EuiToolTip> = node => {
    this.tooltip = node;
  };

  showTooltip = () => {
    if (!this._isMounted || !this.tooltip) {
      return;
    }
    this.tooltip.showToolTip();
  };

  hideTooltip = () => {
    if (!this._isMounted || !this.tooltip) {
      return;
    }
    this.tooltip.hideToolTip();
  };

  render() {
    const {
      className,
      needsUpdate,
      isLoading,
      isDisabled,
      onClick,
      toolTipProps,
      showTooltip,
      ...rest
    } = this.props;

    const classes = classNames('euiSuperUpdateButton', className);

    let buttonText = (
      <EuiI18n
        token="euiSuperUpdateButton.refreshButtonLabel"
        default="Refresh"
      />
    );
    if (needsUpdate || isLoading) {
      buttonText = isLoading ? (
        <EuiI18n
          token="euiSuperUpdateButton.updatingButtonLabel"
          default="Updating"
        />
      ) : (
        <EuiI18n
          token="euiSuperUpdateButton.updateButtonLabel"
          default="Update"
        />
      );
    }

    let tooltipContent;
    if (isDisabled) {
      tooltipContent = (
        <EuiI18n
          token="euiSuperUpdateButton.cannotUpdateTooltip"
          default="Cannot update"
        />
      );
    } else if (needsUpdate && !isLoading) {
      tooltipContent = (
        <EuiI18n
          token="euiSuperUpdateButton.clickToApplyTooltip"
          default="Click to apply"
        />
      );
    }

    return (
      <EuiToolTip
        ref={this.setTootipRef}
        content={tooltipContent}
        position="bottom"
        {...toolTipProps}>
        <EuiButton
          className={classes}
          color={needsUpdate || isLoading ? 'secondary' : 'primary'}
          fill
          iconType={needsUpdate || isLoading ? 'kqlFunction' : 'refresh'}
          textProps={{ className: 'euiSuperUpdateButton__text' }}
          isDisabled={isDisabled}
          onClick={onClick}
          isLoading={isLoading}
          {...rest}>
          {buttonText}
        </EuiButton>
      </EuiToolTip>
    );
  }
}
