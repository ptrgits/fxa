/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { Localized, useLocalization } from '@fluent/react';
import * as Form from '@radix-ui/react-form';

import { ActionButton, ButtonVariant, SubmitButton } from '@fxa/payments/ui';
import couponIcon from '@fxa/shared/assets/images/ico-coupon.svg';
import {
  getLocalizedCurrency,
  getLocalizedCurrencyString,
  getLocalizedDate,
  getLocalizedDateString,
} from '@fxa/shared/l10n';

import * as Dialog from '@radix-ui/react-dialog';
import CloseIcon from '@fxa/shared/assets/images/close.svg';
import { resubscribeSubscriptionAction } from '@fxa/payments/ui/actions';

interface Subscription {
  id: string;
  productName: string;
  webIcon: string;
  canResubscribe: boolean;
  currency: string;
  interval?: string;
  currentInvoiceTax: number;
  currentInvoiceTotal: number;
  currentPeriodEnd: number;
  nextInvoiceDate: number;
  nextInvoiceTax?: number;
  nextInvoiceTotal?: number;
  promotionName?: string | null;
}

interface SubscriptionContentProps {
  userId: string;
  subscription: Subscription;
  locale: string;
}

export const SubscriptionContent = ({
  userId,
  subscription,
  locale,
}: SubscriptionContentProps) => {
  const {
    canResubscribe,
    currency,
    currentInvoiceTax,
    currentInvoiceTotal,
    currentPeriodEnd,
    nextInvoiceDate,
    nextInvoiceTax,
    nextInvoiceTotal,
    productName,
    webIcon,
    promotionName,
  } = subscription;

  const [checkedState, setCheckedState] = useState(false);
  const [showCancel, setShowCancel] = useState(false);
  const [openResubscribeDialog, setOpenResubscribeDialog] = useState(false);
  const [openResubscribeSuccessDialog, setOpenResubscribeSuccessDialog] = useState(false);
  const [pendingResubscribe, setPendingResubscribe] = useState(false);
  const [showResubscribeActionError, setResubscribeActionError] = useState(false);

  // Fluent React Overlays cause hydration issues due to SSR.
  // Using isClient along with the useEffect ensures its only run Client Side
  // Note this currently only affects strings that make use of React Overlays.
  // Other strings are localized in SSR as expected.
  // - https://github.com/projectfluent/fluent.js/wiki/React-Overlays
  // - https://nextjs.org/docs/messages/react-hydration-error
  const [isClient, setIsClient] = useState(false);
  useEffect(() => setIsClient(true), []);

  const { l10n } = useLocalization();
  const getCurrencyFallbackText = (amount: number) => {
    return getLocalizedCurrencyString(amount, currency, locale);
  };
  const nextInvoiceDateShortFallback = getLocalizedDateString(
    nextInvoiceDate,
    true,
    locale
  );
  const currentPeriodEndLongFallback = getLocalizedDateString(
    currentPeriodEnd,
    false,
    locale
  );

  async function resubscribe() {
    setPendingResubscribe(true);
    setResubscribeActionError(false);

    const result = await resubscribeSubscriptionAction(userId, subscription.id);
    if (result.ok) {
      setOpenResubscribeDialog(false);
      // TODO: This is a workaround to match existing legacy behavior.
      // Fix as part of redesign
      await new Promise((resolve) => setTimeout(resolve, 500));
      setOpenResubscribeSuccessDialog(true);
    } else {
      setResubscribeActionError(true);
    }
    setPendingResubscribe(false);
  }

  return (
    <>
      <Dialog.Root open={openResubscribeSuccessDialog}>
        <Dialog.Portal>
          <Dialog.Overlay className='fixed inset-0 bg-black/75 z-50' />
          <Dialog.Content
            className='w-11/12 max-w-[545px] text-center px-7 pt-6 pb-8 rounded-xl shadow inline-block fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-9999 bg-white'
            onEscapeKeyDown={() => setOpenResubscribeSuccessDialog(false)}
            onPointerDownOutside={() => setOpenResubscribeSuccessDialog(false)}
            onInteractOutside={() => setOpenResubscribeSuccessDialog(false)}
          >
            <Dialog.Title className='font-bold leading-6 m-5 space-y-5'>
              <Image src={webIcon} alt={productName} height={64} width={64} className='h-16 w-16 mx-auto' />
              <Localized
                id="resubscribe-success-dialog-title"
              >
                <p>Thanks! You’re all set.</p>
              </Localized>
            </Dialog.Title>
            <Dialog.Description className='leading-6 space-y-4'>
              <Localized
                id="resubscribe-success-dialog-action-button"
              >
                <SubmitButton
                  className="h-10 w-full"
                  variant={ButtonVariant.Primary}
                  onClick={() => setOpenResubscribeSuccessDialog(false)}
                  aria-label={`Stay subscribed to ${productName}`}
                >
                  Close
                </SubmitButton>
              </Localized>
            </Dialog.Description>
            <Dialog.Close asChild
            >
              <button
                className="absolute bg-transparent border-0 cursor-pointer flex items-center justify-center w-6 h-6 m-0 p-0 top-4 right-4 hover:bg-grey-200 hover:rounded focus:border-blue-400 focus:rounded focus:shadow-input-blue-focus after:absolute after:content-[''] after:top-0 after:left-0 after:w-full after:h-full after:bg-white after:opacity-50 after:z-10"
                onClick={() => setOpenResubscribeSuccessDialog(false)}
              >
                <Image src={CloseIcon} alt={l10n.getString('dialog-close', null, 'Close dialog')} />
              </button>
            </Dialog.Close>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <Dialog.Root open={openResubscribeDialog}>
        <Dialog.Portal>
          <Dialog.Overlay className='fixed inset-0 bg-black/75 z-50' />
          <Dialog.Content
            className='w-11/12 max-w-[545px] text-center px-7 pt-6 pb-8 rounded-xl shadow inline-block fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-9999 bg-white'
            onEscapeKeyDown={() => setOpenResubscribeDialog(false)}
            onPointerDownOutside={() => setOpenResubscribeDialog(false)}
            onInteractOutside={() => setOpenResubscribeDialog(false)}
          >
            <Dialog.Title className='font-bold leading-6 m-5 space-y-5'>
              <Image src={webIcon} alt={productName} height={64} width={64} className='h-16 w-16 mx-auto' />
              <Localized
                id="resubscribe-dialog-title"
                vars={{
                  name: productName,
                }}
              >
                <p>Want to keep using {productName}?</p>
              </Localized>
            </Dialog.Title>
            <Dialog.Description asChild className='leading-6 space-y-4'>
              <div>
                <Localized
                  id="resubscribe-dialog-content"
                  vars={{
                    name: productName,
                    amount: getLocalizedCurrency(nextInvoiceTotal ?? 0, currency),
                    endDate: getLocalizedDate(currentPeriodEnd),
                  }}
                >
                  <p>
                    Your access to {productName} will continue, and your billing cycle
                    and payment will stay the same. Your next charge will be{' '}
                    {getLocalizedCurrencyString(nextInvoiceTotal ?? 0, currency, locale)} on{' '}
                    {getLocalizedDateString(currentPeriodEnd, undefined, locale)}.
                  </p>
                </Localized>
                {showResubscribeActionError && (
                  <Localized id="subscription-content-cancel-action-error">
                    <p className="mt-1 text-alert-red font-normal text-start" role="alert">
                      An unexpected error occurred. Please try again.
                    </p>
                  </Localized>
                )}
                <ActionButton
                  className="h-10 w-full"
                  variant={ButtonVariant.Primary}
                  aria-label={`Stay subscribed to ${productName}`}
                  onClick={resubscribe}
                  pending={pendingResubscribe}
                >
                  <Localized
                    id="resubscribe-dialog-action-button"
                    vars={{ productName }}
                    attrs={{ 'aria-label': true }}
                  >
                    Stay Subscribed
                  </Localized>
                </ActionButton>
              </div>
            </Dialog.Description>
            <Dialog.Close asChild
            >
              <button
                className="absolute bg-transparent border-0 cursor-pointer flex items-center justify-center w-6 h-6 m-0 p-0 top-4 right-4 hover:bg-grey-200 hover:rounded focus:border-blue-400 focus:rounded focus:shadow-input-blue-focus after:absolute after:content-[''] after:top-0 after:left-0 after:w-full after:h-full after:bg-white after:opacity-50 after:z-10"
                onClick={() => setOpenResubscribeDialog(false)}
              >
                <Image src={CloseIcon} alt={l10n.getString('dialog-close', null, 'Close dialog')} />
              </button>
            </Dialog.Close>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {showCancel ? (
        <Form.Root
          aria-labelledby="cancel-subscription-heading"
          aria-describedby="cancel-subscription-desc"
        >
          <Localized id="subscription-content-heading-cancel-subscription">
            <h4 id="cancel-subscription-heading" className="pt-6">
              Cancel Subscription
            </h4>
          </Localized>
          <Form.Field name="cancelAccess" className="text-grey-400 text-sm">
            <Localized
              id="subscription-content-no-longer-use-message"
              vars={{
                productName,
                currentPeriodEnd: currentPeriodEndLongFallback,
              }}
            >
              <p className="py-3" id="cancel-subscription-desc">
                You will no longer be able to use {productName} after{' '}
                {currentPeriodEndLongFallback}, the last day of your billing
                cycle.
              </p>
            </Localized>
            <Form.Label asChild className="cursor-pointer my-3">
              <label htmlFor="cancelAccess" className="flex items-center gap-4">
                <Form.Control asChild>
                  <input
                    id="cancelAccess"
                    name="cancelAccess"
                    type="checkbox"
                    className="ml-1 grow-0 shrink-0 basis-4 scale-150 cursor-pointer"
                    onChange={(e) => setCheckedState(e.target.checked)}
                    required
                  />
                </Form.Control>
                <Localized
                  id="subscription-content-cancel-access-message"
                  vars={{
                    productName,
                    currentPeriodEnd: currentPeriodEndLongFallback,
                  }}
                >
                  <span>
                    Cancel my access and my saved information within{' '}
                    {productName} on {currentPeriodEndLongFallback}
                  </span>
                </Localized>
              </label>
            </Form.Label>
          </Form.Field>
          <div className="flex flex-col gap-4 tablet:flex-row items-center justify-between pt-3">
            <Localized
              id="subscription-content-button-stay-subscribed"
              vars={{ productName }}
              attrs={{ 'aria-label': true }}
            >
              <SubmitButton
                className="h-10 w-full tablet:w-1/2"
                variant={ButtonVariant.Primary}
                onClick={() => setShowCancel(false)}
                aria-label={`Stay subscribed to ${productName}`}
              >
                Stay Subscribed
              </SubmitButton>
            </Localized>
            <Form.Submit asChild>
              <Localized
                id="subscription-content-button-cancel-subscription"
                vars={{ productName }}
                attrs={{ 'aria-label': true }}
              >
                <SubmitButton
                  className={`h-10 w-full tablet:w-1/2 ${!checkedState && 'bg-grey-50 text-grey-300 hover:bg-grey-50 hover:cursor-not-allowed hover:bg-inherit aria-disabled:cursor-not-allowed aria-disabled:pointer-events-none'}`}
                  variant={ButtonVariant.Secondary}
                  disabled={!checkedState}
                  aria-label={`Cancel your subscription to ${productName}`}
                >
                  Cancel Subscription
                </SubmitButton>
              </Localized>
            </Form.Submit>
          </div>
        </Form.Root>
      ) : (
        <section className="flex items-center justify-between gap-4 my-4">
          {canResubscribe ? (
            <>
              {isClient && (
                <Localized
                  id="subscription-content-resubscribe"
                  vars={{
                    name: subscription.productName,
                    date: getLocalizedDate(subscription.currentPeriodEnd),
                  }}
                  elems={{
                    strong: <strong></strong>
                  }}
                >
                  <p className="text-sm leading-4 text-grey-400">
                    You will lose access to {subscription.productName} on{' '}
                    <strong>{getLocalizedDateString(subscription.currentPeriodEnd, undefined, locale)}</strong>.
                  </p>
                </Localized>
              )}
              <Localized
                id="subscription-content-button-resubscribe"
                vars={{ productName }}
                attrs={{ 'aria-label': true }}
              >
                <SubmitButton
                  className="h-10"
                  variant={ButtonVariant.Secondary}
                  onClick={() => setOpenResubscribeDialog(true)}
                  aria-label={`Resubscribe to ${productName}`}
                >
                  Resubscribe
                </SubmitButton>
              </Localized>
            </>
          ) : (
            <>
              <div className="flex items-start gap-2 text-sm">
                {promotionName && (
                  <Image src={couponIcon} alt="" role="presentation" />
                )}
                <div>
                  <div className="font-semibold pb-1 -mt-1">
                    {promotionName ? (
                      currentInvoiceTax ? (
                        <Localized
                          id="subscription-content-promotion-applied-with-tax"
                          vars={{
                            invoiceTotal:
                              getCurrencyFallbackText(currentInvoiceTotal),
                            promotionName,
                            taxDue: getCurrencyFallbackText(currentInvoiceTax),
                          }}
                        >
                          <p>
                            {productName} coupon applied:{' '}
                            {getCurrencyFallbackText(currentInvoiceTotal)} +{' '}
                            {getCurrencyFallbackText(currentInvoiceTax)} tax
                          </p>
                        </Localized>
                      ) : (
                        <Localized
                          id="subscription-content-promotion-applied-no-tax"
                          vars={{
                            invoiceTotal:
                              getCurrencyFallbackText(currentInvoiceTotal),
                            promotionName,
                          }}
                        >
                          <p>
                            {promotionName} coupon applied:{' '}
                            {getCurrencyFallbackText(currentInvoiceTotal)}
                          </p>
                        </Localized>
                      )
                    ) : currentInvoiceTax ? (
                      <Localized
                        id="subscription-content-current-with-tax"
                        vars={{
                          invoiceTotal:
                            getCurrencyFallbackText(currentInvoiceTotal),
                          taxDue: getCurrencyFallbackText(currentInvoiceTax),
                        }}
                      >
                        <p>
                          {getCurrencyFallbackText(currentInvoiceTotal)} +{' '}
                          {getCurrencyFallbackText(currentInvoiceTax)} tax
                        </p>
                      </Localized>
                    ) : (
                      <p>{getCurrencyFallbackText(currentInvoiceTotal)}</p>
                    )}
                  </div>
                  {nextInvoiceTotal && (
                    <div className="text-grey-400">
                      {nextInvoiceTax ? (
                        <Localized
                          id="subscription-content-next-bill-with-tax"
                          vars={{
                            invoiceTotal: getCurrencyFallbackText(nextInvoiceTotal),
                            nextBillDate: nextInvoiceDateShortFallback,
                            taxDue: getCurrencyFallbackText(nextInvoiceTax),
                          }}
                        >
                          <p>
                            Next bill of {getCurrencyFallbackText(nextInvoiceTotal)}{' '}
                            + {getCurrencyFallbackText(nextInvoiceTax)} tax is due{' '}
                            {nextInvoiceDateShortFallback}
                          </p>
                        </Localized>
                      ) : (
                        <Localized
                          id="subscription-content-next-bill-no-tax"
                          vars={{
                            invoiceTotal: getCurrencyFallbackText(nextInvoiceTotal),
                            nextBillDate: nextInvoiceDateShortFallback,
                          }}
                        >
                          <p>
                            Next bill of {getCurrencyFallbackText(nextInvoiceTotal)}{' '}
                            is due {nextInvoiceDateShortFallback}
                          </p>
                        </Localized>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <Localized
                id="subscription-content-button-cancel"
                vars={{ productName }}
                attrs={{ 'aria-label': true }}
              >
                <SubmitButton
                  className="h-10"
                  variant={ButtonVariant.Secondary}
                  onClick={() => setShowCancel(true)}
                  aria-label={`Cancel your subscription for ${productName}`}
                >
                  Cancel
                </SubmitButton>
              </Localized>
            </>
          )}

        </section>
      )}
    </>
  );
};
