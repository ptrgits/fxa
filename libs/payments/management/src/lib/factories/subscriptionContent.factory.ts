/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { faker } from '@faker-js/faker';
import { SubplatInterval } from '@fxa/payments/customer';
import { SubscriptionContent } from '../types';

export const SubscriptionContentFactory = (
  override?: Partial<SubscriptionContent>
): SubscriptionContent => ({
  id: `sub_${faker.string.alphanumeric({ length: 24 })}`,
  productName: faker.string.sample(),
  webIcon: faker.internet.url(),
  canResubscribe: false,
  currency: faker.finance.currencyCode().toLowerCase(),
  interval: faker.helpers.enumValue(SubplatInterval),
  currentInvoiceTax: faker.number.int({ min: 1, max: 1000 }),
  currentInvoiceTotal: faker.number.int({ min: 1, max: 1000 }),
  currentPeriodEnd: faker.date.future().getDate(),
  nextInvoiceDate: faker.date.future().getDate(),
  nextInvoiceTax: faker.number.int({ min: 1, max: 1000 }),
  nextInvoiceTotal: faker.number.int({ min: 1, max: 1000 }),
  ...override,
});
