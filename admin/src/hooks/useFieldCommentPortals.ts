import { useState, useRef, useCallback, useEffect } from 'react';
import { Review } from '../types';

export interface PortalTarget {
  fieldName: string;
  buttonMount: HTMLElement | null;
  displayMount: HTMLElement | null;
}

interface UseFieldCommentPortalsOptions {
  isEnabled: boolean;
  isActive: boolean;
  canAddComments: boolean;
  isReviewer: boolean;
  isRequester: boolean;
  review: Review | null | undefined;
}

export const useFieldCommentPortals = ({
  isEnabled,
  isActive,
  canAddComments,
  isReviewer,
  isRequester,
  review,
}: UseFieldCommentPortalsOptions): PortalTarget[] => {
  const [portalTargets, setPortalTargets] = useState<PortalTarget[]>([]);
  const mountNodesRef = useRef<HTMLElement[]>([]);

  const buildPortalTargets = useCallback(() => {
    mountNodesRef.current.forEach((node) => {
      try {
        node.parentElement?.removeChild(node);
      } catch {
        /* already gone */
      }
    });
    mountNodesRef.current = [];

    if (!isActive || !review?.documentId || (!isReviewer && !isRequester)) {
      setPortalTargets([]);
      return;
    }

    // Label-first discovery: scan every labeled field in the form.
    // Phase 1: collect (label, fieldName) pairs - needed for the signature check
    const allLabels = Array.from(document.querySelectorAll<HTMLLabelElement>('main label[id]'));
    // Pre-build a lookup map: aria-labelledby value → named element (for block editors etc.)
    const ariaLabelledElements = Array.from(
      document.querySelectorAll<HTMLElement>('[aria-labelledby][name]')
    );

    const labelFieldPairs: { label: HTMLLabelElement; fieldName: string }[] = [];

    // Regex for valid Strapi field names (lowercase/uppercase, digits, underscores - no dashes)
    const validFieldNameRe = /^[a-z_][a-z0-9_]*$/i;

    for (const label of allLabels) {
      let fieldName: string | null = null;

      if (label.htmlFor) {
        const el = document.getElementById(label.htmlFor);

        if (el) {
          // S1: native form element with a name attribute (inputs, checkboxes, relation comboboxes)
          const elName = el.getAttribute('name');
          const elType = (el as HTMLInputElement | null)?.type;
          if (elName && elType !== 'hidden') {
            fieldName = elName;
          }

          if (!fieldName) {
            // S2: child <section aria-label="..."> - catches media/carousel fields where the
            // field container div holds a carousel section labelled with the field name
            const sectionWithLabel = el.querySelector<HTMLElement>('section[aria-label]');
            if (sectionWithLabel) {
              fieldName = sectionWithLabel.getAttribute('aria-label');
            }
          }

          if (!fieldName) {
            // S3: named non-hidden child input/select/textarea (fallback for wrapped inputs)
            const namedInput = el.querySelector<HTMLInputElement>(
              'input[name]:not([type="hidden"]), select[name], textarea[name]'
            );
            if (namedInput) {
              fieldName = namedInput.getAttribute('name');
            }
          }

          if (!fieldName) {
            // S4: hidden inputs inside the container (react-select with visible container div)
            const hiddenInput = el.querySelector<HTMLInputElement>('input[name][type="hidden"]');
            if (hiddenInput) {
              fieldName = hiddenInput.getAttribute('name');
            }
          }
        } else {
          // el not found - label.htmlFor references a generated id that has no matching DOM node
          // (common with react-select where the label for="" points to an internal id that React
          // never actually renders as an id on the select container)
          const fieldWrapper = label.parentElement?.parentElement;
          if (fieldWrapper) {
            // S5: sibling element whose id looks like a real field name (e.g. id="publish_in")
            // react-select containers get id="<fieldName>" set by Strapi
            const siblingWithFieldId = Array.from(
              fieldWrapper.querySelectorAll<HTMLElement>('[id]')
            ).find((sibling) => {
              const id = sibling.getAttribute('id') || '';
              return validFieldNameRe.test(id);
            });
            if (siblingWithFieldId) {
              fieldName = siblingWithFieldId.getAttribute('id');
            }

            if (!fieldName) {
              // S6: hidden inputs within the field wrapper (alternative path for react-select)
              const hiddenInput = fieldWrapper.querySelector<HTMLInputElement>(
                'input[name][type="hidden"]'
              );
              if (hiddenInput) {
                fieldName = hiddenInput.getAttribute('name');
              }
            }
          }
        }
      }

      // S7: element with aria-labelledby pointing to this label + name attribute
      // Catches block editor comboboxes: <div name="teaser_text" aria-labelledby=":id:-label">
      if (!fieldName && label.id) {
        const ariaEl = ariaLabelledElements.find((el) =>
          el.getAttribute('aria-labelledby')?.split(' ').includes(label.id)
        );
        if (ariaEl) {
          fieldName = ariaEl.getAttribute('name');
        }
      }

      // S8: label text content as last resort - for custom JSON editors, repeatable components
      // and other widgets that render no named input in the DOM.
      // Only use when a for= attribute is set (confirming this is a real field label).
      if (!fieldName && label.htmlFor) {
        const textContent = Array.from(label.childNodes)
          .filter((n) => n.nodeType === Node.TEXT_NODE)
          .map((n) => n.textContent?.trim() || '')
          .join('')
          .trim();
        if (textContent && validFieldNameRe.test(textContent)) {
          fieldName = textContent;
        }
      }

      if (!fieldName) {
        continue;
      }
      labelFieldPairs.push({ label, fieldName });
    }

    const targets: PortalTarget[] = [];

    for (const { label, fieldName } of labelFieldPairs) {
      // Button mount: inserted right after the label element
      let buttonMount: HTMLElement | null = null;
      if (canAddComments) {
        buttonMount = document.createElement('span');
        label.parentElement?.insertBefore(buttonMount, label.nextSibling);
        mountNodesRef.current.push(buttonMount);
      }

      // Display mount: inserted after the label row (label.parentElement) but before
      // the actual input widget - so comment cards appear between the title and the field.
      let displayMount: HTMLElement | null = null;
      const hasComments = (review.comments || []).some(
        (c) => c.commentType === 'field-comment' && c.fieldName === fieldName
      );
      if (hasComments) {
        displayMount = document.createElement('div');
        const labelRow = label.parentElement;
        labelRow?.parentElement?.insertBefore(displayMount, labelRow.nextSibling);
        mountNodesRef.current.push(displayMount);
      }

      if (buttonMount || displayMount) {
        targets.push({ fieldName, buttonMount, displayMount });
      }
    }

    setPortalTargets(targets);
  }, [isActive, canAddComments, isReviewer, isRequester, review]);

  useEffect(() => {
    if (!isEnabled || !review) {
      mountNodesRef.current.forEach((node) => {
        try {
          node.parentElement?.removeChild(node);
        } catch {
          /* already gone */
        }
      });
      mountNodesRef.current = [];
      setPortalTargets([]);
      return;
    }

    let timer = setTimeout(buildPortalTargets, 150);
    const observer = new MutationObserver(() => {
      clearTimeout(timer);
      timer = setTimeout(buildPortalTargets, 150);
    });

    const main = document.querySelector('main');
    if (main) {
      observer.observe(main, { childList: true, subtree: false });
    }

    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, [isEnabled, review, buildPortalTargets]);

  // Cleanup mount nodes on unmount
  useEffect(() => {
    return () => {
      mountNodesRef.current.forEach((node) => {
        try {
          node.parentElement?.removeChild(node);
        } catch {
          /* already gone */
        }
      });
    };
  }, []);

  return portalTargets;
};
