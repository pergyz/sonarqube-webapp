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

import { Button, ButtonVariety } from '@sonarsource/echoes-react';
import { Modal } from '~design-system';
import { translate, translateWithParameters } from '~sq-server-commons/helpers/l10n';
import { useDeleteGroupMutation } from '~sq-server-commons/queries/groups';
import { Group } from '~sq-server-commons/types/types';

interface Props {
  group: Group;
  onClose: () => void;
}

export default function DeleteGroupForm(props: Readonly<Props>) {
  const { group } = props;

  const { mutate: deleteGroup, isPending } = useDeleteGroupMutation();

  const onSubmit = () => {
    deleteGroup(group.id, {
      onSuccess: props.onClose,
    });
  };

  return (
    <Modal
      body={translateWithParameters('groups.delete_group.confirmation', group.name)}
      headerTitle={translate('groups.delete_group')}
      onClose={props.onClose}
      primaryButton={
        <Button
          hasAutoFocus
          isDisabled={isPending}
          onClick={onSubmit}
          type="submit"
          variety={ButtonVariety.Danger}
        >
          {translate('delete')}
        </Button>
      }
      secondaryButtonLabel={translate('cancel')}
    />
  );
}
