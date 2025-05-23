/*
 * SonarQube
 * Copyright (C) 2009-2025 SonarSource SA
 * mailto:info AT sonarsource DOT com
 *
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU Lesser General Public
 * License as published by the Free Software Foundation; either
 * version 3 of the License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with this program; if not, write to the Free Software Foundation,
 * Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.
 */

import { FormattedMessage } from 'react-intl';
import { ClipboardIconButton } from '~shared/components/clipboard';
import { NumberedList, NumberedListItem } from '../../../design-system';
import { translate } from '../../../helpers/l10n';
import { TokenType } from '../../../types/token';
import { Component } from '../../../types/types';
import { LoggedInUser } from '../../../types/users';
import EditTokenModal from '../components/EditTokenModal';
import { InlineSnippet } from '../components/InlineSnippet';
import SentenceWithHighlights from '../components/SentenceWithHighlights';

export interface ServiceEndpointStepProps {
  baseUrl: string;
  component: Component;
  currentUser: LoggedInUser;
}

export default function ServiceEndpointStepContent(props: Readonly<ServiceEndpointStepProps>) {
  const { baseUrl, component, currentUser } = props;

  return (
    <NumberedList>
      <NumberedListItem>
        <SentenceWithHighlights
          highlightKeys={['menu']}
          translationKey="onboarding.tutorial.with.azure_pipelines.ServiceEndpoint.step1"
        />
      </NumberedListItem>
      <NumberedListItem>
        <SentenceWithHighlights
          highlightKeys={['type']}
          translationKey="onboarding.tutorial.with.azure_pipelines.ServiceEndpoint.step2"
        />
      </NumberedListItem>
      <NumberedListItem className="sw-flex sw-items-center">
        <FormattedMessage
          id="onboarding.tutorial.with.azure_pipelines.ServiceEndpoint.step3.sentence"
          values={{
            url: (
              <span className="sw-ml-1">
                <InlineSnippet snippet={baseUrl} />
              </span>
            ),
            button: <ClipboardIconButton className="sw-ml-2" copyValue={baseUrl} />,
          }}
        />
      </NumberedListItem>
      <NumberedListItem>
        <span>
          {translate('onboarding.tutorial.with.azure_pipelines.ServiceEndpoint.step4.sentence')}:
        </span>
        <EditTokenModal
          component={component}
          currentUser={currentUser}
          preferredTokenType={TokenType.Global}
        />
      </NumberedListItem>
      <NumberedListItem>
        {translate('onboarding.tutorial.with.azure_pipelines.ServiceEndpoint.step5.sentence')}
      </NumberedListItem>
      <NumberedListItem>
        {translate('onboarding.tutorial.with.azure_pipelines.ServiceEndpoint.step6.sentence')}
      </NumberedListItem>
    </NumberedList>
  );
}
