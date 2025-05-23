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

import { Button, ButtonVariety, ModalAlert, Text } from '@sonarsource/echoes-react';
import * as React from 'react';
import { useIntl } from 'react-intl';
import { FlagMessage, FormField, InputField } from '~design-system';
import { translate } from '~sq-server-commons/helpers/l10n';
import { validateProjectKey } from '~sq-server-commons/helpers/projects';
import { ProjectKeyValidationResult } from '~sq-server-commons/types/component';
import { Component } from '~sq-server-commons/types/types';

export interface UpdateFormProps {
  component: Pick<Component, 'key' | 'name'>;
  onKeyChange: (newKey: string) => Promise<void>;
}

export default function UpdateForm({ component, onKeyChange }: Readonly<UpdateFormProps>) {
  const intl = useIntl();
  const [newKey, setNewKey] = React.useState(component.key);
  const hasChanged = newKey !== component.key;

  const validationResult = validateProjectKey(newKey);
  const error =
    validationResult === ProjectKeyValidationResult.Valid
      ? undefined
      : translate('onboarding.create_project.project_key.error', validationResult);

  const onInputChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setNewKey(e.currentTarget.value);
    },
    [setNewKey],
  );

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
      }}
    >
      <FormField htmlFor="project-key-input" label={translate('update_key.new_key')} required>
        <InputField
          aria-describedby="project-key-input-error project-key-input-hint"
          aria-invalid={hasChanged && error !== undefined}
          autoFocus
          id="project-key-input"
          isInvalid={hasChanged && error !== undefined}
          isValid={hasChanged && error === undefined}
          name="update_key.new_key"
          onChange={onInputChange}
          required
          type="text"
          value={newKey}
        />

        <output>
          {Boolean(error) && (
            <FlagMessage
              className="sw-mt-2 sw-w-abs-400"
              id="project-key-input-error"
              variant="error"
            >
              {error}
            </FlagMessage>
          )}
        </output>

        <Text className="sw-mt-2 sw-max-w-1/2" isSubdued>
          <span id="project-key-input-hint">
            {translate('onboarding.create_project.project_key.description')}
          </span>
        </Text>
      </FormField>

      <div className="sw-mt-2">
        <ModalAlert
          content={
            <>
              <span>
                {translate('update_key.old_key')}:&nbsp;
                <strong className="sw-typo-lg-semibold">{component.key}</strong>
              </span>
              <div className="sw-mt-2">
                {translate('update_key.new_key')}:&nbsp;
                <strong className="sw-typo-lg-semibold">{newKey}</strong>
              </div>
            </>
          }
          description={intl.formatMessage(
            { id: 'update_key.are_you_sure_to_change_key' },
            { '0': component.name },
          )}
          primaryButton={
            <Button onClick={() => onKeyChange(newKey)} variety={ButtonVariety.Primary}>
              {translate('update_verb')}
            </Button>
          }
          title={translate('update_key.page')}
        >
          <Button
            id="update-key-submit"
            isDisabled={!hasChanged || error !== undefined}
            type="submit"
            variety={ButtonVariety.Primary}
          >
            {translate('update_verb')}
          </Button>
        </ModalAlert>

        <Button
          className="sw-ml-2"
          id="update-key-reset"
          isDisabled={!hasChanged}
          onClick={() => {
            setNewKey(component.key);
          }}
          type="reset"
          variety={ButtonVariety.Default}
        >
          {translate('reset_verb')}
        </Button>
      </div>
    </form>
  );
}
