import { forwardRef, useCallback, useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import { clsx } from "clsx";
import { MdClose } from "react-icons/md";
import { classPrefix, loadStyles } from "../../utils/styles.utils";
import {
  type ModalHeaderProps,
  type ModalProps,
  type ModalContentProps,
  type ModalBodyProps,
  type ModalInnerProps,
  type ModalCloseButtonProps,
  type ModalBackdropProps,
} from "./Modal.types";
import styles from "./Modal.module.scss";
import { useTheme } from "../../context/ThemeContext";
import { Button } from "../Button/Button";
import { useMountTransition } from "../../hooks/useMountTransition.hook";
import { useKeyboardShortcut } from "../../hooks/useKeyboardShortcut.hook";
import { FocusLock } from "../../utils/FocusLock";
import { mergeRefs } from "../../utils/refs.utils";
import { getOverlayElements } from "../../utils/dom.utils";

const TRANSITION_DURATION = 200;

export const Modal = forwardRef<HTMLDivElement, ModalProps>(
  (
    {
      children,
      className,
      style = {},
      isOpen,
      onClose,
      title,
      width,
      padding,
      showCloseButton = true,
      closeButtonProps,
      showBackdrop = true,
      centered = false,
      fullScreen = false,
      closeOnEsc = true,
      closeOnClickOutside = true,
      backdropClassName,
      innerClassName,
      contentClassName,
      headerClassName,
      bodyClassName,
      transitionDuration,
      zIndex,
      lockScroll = true,
      trapFocus = true,
      autoFocus = true,
      returnFocus = true,
      onBackdropClick,
      target,
      ...restProps
    },
    ref
  ) => {
    const { themeStyles, themeClasses } = useTheme();
    const { isContentVisible, isTransitionClassApplied } = useMountTransition(
      isOpen,
      TRANSITION_DURATION
    );

    const modalRef = useRef<HTMLDivElement>(null);
    const modalContentRef = useRef<HTMLDivElement>(null);

    const hasHeader = !!title;

    // Handle keyboard shortcuts
    const onEscape = useCallback(() => {
      if (closeOnEsc) {
        const modals = getOverlayElements("Modal");
        const lastModal = modals[modals.length - 1];
        if (lastModal && lastModal === modalRef.current) onClose();
      }
    }, [closeOnEsc, onClose]);

    const keyListenersMap = useMemo(
      () => ({
        Escape: onEscape,
      }),
      [onEscape]
    );
    useKeyboardShortcut(keyListenersMap);

    // Disable browser scrolling when modal is opened
    useEffect(() => {
      if (lockScroll) {
        const modals = getOverlayElements("Modal");
        if (isContentVisible && modals.length === 1)
          document.body.classList.add(styles.Modal__noScroll);
        else if (modals.length === 0)
          document.body.classList.remove(styles.Modal__noScroll);
      }
    }, [lockScroll, isContentVisible]);

    return isContentVisible
      ? createPortal(
          <FocusLock
            isLocked={trapFocus}
            autoFocusOnMount={autoFocus}
            returnFocusOnClose={returnFocus}
          >
            <div
              className={clsx(
                classPrefix("Modal"),
                styles.Modal,
                {
                  [styles.Modal__opened]: isOpen,
                  [styles.Modal__centered]: centered,
                  [styles.Modal__hasHeader]: hasHeader,
                  [styles.Modal__fullscreen]: fullScreen,
                  [styles.Modal__transition]: isTransitionClassApplied,
                  ...themeClasses,
                },
                className
              )}
              style={{
                ...themeStyles,
                ...loadStyles({
                  "--modal-transition-duration": `${
                    transitionDuration ?? TRANSITION_DURATION
                  }ms`,
                  "--modal-z-index": zIndex,
                  "--modal-width": width,
                  "--modal-padding": padding,
                }),
                ...style,
              }}
              role="dialog"
              ref={mergeRefs(ref, modalRef)}
              {...restProps}
            >
              {showBackdrop && (
                <ModalBackdrop
                  onClick={() => {
                    onBackdropClick?.();
                    if (closeOnClickOutside) onClose();
                  }}
                  aria-hidden="true"
                  className={backdropClassName}
                />
              )}
              <ModalInner className={innerClassName}>
                <ModalContent
                  tabIndex={-1}
                  aria-modal={true}
                  aria-labelledby={title}
                  className={contentClassName}
                  ref={modalContentRef}
                >
                  {hasHeader && (
                    <ModalHeader className={headerClassName}>
                      {title}
                      {showCloseButton && (
                        <ModalCloseButton
                          onClose={onClose}
                          closeButtonProps={closeButtonProps}
                        />
                      )}
                    </ModalHeader>
                  )}
                  {!hasHeader && showCloseButton && (
                    <ModalCloseButton
                      onClose={onClose}
                      closeButtonProps={closeButtonProps}
                    />
                  )}
                  <ModalBody className={bodyClassName}>{children}</ModalBody>
                </ModalContent>
              </ModalInner>
            </div>
          </FocusLock>,
          target ?? document.body
        )
      : null;
  }
);

Modal.displayName = "Modal";

const ModalBackdrop = ({
  children,
  className,
  style = {},
  onClick,
}: ModalBackdropProps) => {
  return (
    <div
      className={clsx(
        classPrefix("Modal-backdrop"),
        styles.Modal__backdrop,
        className
      )}
      style={style}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

ModalBackdrop.displayName = "ModalBackdrop";

const ModalInner = ({ children, className, style = {} }: ModalInnerProps) => {
  return (
    <div
      className={clsx(
        classPrefix("Modal-inner"),
        styles.Modal__inner,
        className
      )}
      style={style}
    >
      {children}
    </div>
  );
};

ModalInner.displayName = "ModalInner";

export const ModalContent = forwardRef<HTMLDivElement, ModalContentProps>(
  ({ children, className, style = {} }, ref) => {
    return (
      <div
        className={clsx(
          classPrefix("Modal-content"),
          styles.Modal__content,
          className
        )}
        style={style}
        ref={ref}
      >
        {children}
      </div>
    );
  }
);

ModalContent.displayName = "ModalContent";

const ModalHeader = ({ children, className, style = {} }: ModalHeaderProps) => {
  return (
    <div
      className={clsx(
        classPrefix("Modal-header"),
        styles.Modal__header,
        className
      )}
      style={style}
    >
      {children}
    </div>
  );
};

ModalHeader.displayName = "ModalHeader";

const ModalBody = ({ children, className, style = {} }: ModalBodyProps) => {
  return (
    <div
      className={clsx(classPrefix("Modal-body"), styles.Modal__body, className)}
      style={style}
    >
      {children}
    </div>
  );
};

ModalBody.displayName = "ModalBody";

const ModalCloseButton = ({
  className,
  style = {},
  onClose,
  closeButtonProps,
}: ModalCloseButtonProps) => {
  return (
    <div
      className={clsx(
        classPrefix("Modal-close-button"),
        styles.Modal__closeButton,
        className
      )}
      style={style}
    >
      <Button
        iconOnly
        compact
        kind="subtle"
        onClick={() => {
          onClose();
        }}
        aria-label="Close"
        {...closeButtonProps}
      >
        <MdClose />
      </Button>
    </div>
  );
};

ModalCloseButton.displayName = "ModalCloseButton";