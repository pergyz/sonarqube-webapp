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

import { keyBy } from 'lodash';
import * as React from 'react';
import { getValues } from '~sq-server-commons/api/settings';
import {
  ExtendedSettingDefinition,
  SettingDefinitionAndValue,
} from '~sq-server-commons/types/settings';
import { Component } from '~sq-server-commons/types/types';
import { SETTING_CONFIRMATION_MESSAGE_IDS } from '../constants';
import SubCategoryDefinitionsList from './SubCategoryDefinitionsList';

interface Props {
  category: string;
  component?: Component;
  definitions: ExtendedSettingDefinition[];
  displaySubCategoryTitle?: boolean;
  noPadding?: boolean;
  subCategory?: string;
}

interface State {
  settings: SettingDefinitionAndValue[];
}

export default class CategoryDefinitionsList extends React.PureComponent<Props, State> {
  state: State = { settings: [] };

  componentDidMount() {
    this.loadSettingValues();
  }

  componentDidUpdate(prevProps: Props) {
    if (prevProps.category !== this.props.category) {
      this.loadSettingValues();
    }
  }

  async loadSettingValues() {
    const { category, component, definitions } = this.props;

    const categoryDefinitions = definitions.filter(
      (definition) => definition.category.toLowerCase() === category.toLowerCase(),
    );

    const keys = categoryDefinitions.map((definition) => definition.key);

    const values = await getValues({
      keys,
      component: component?.key,
    }).catch(() => []);

    const valuesByDefinitionKey = keyBy(values, 'key');

    const settings: SettingDefinitionAndValue[] = categoryDefinitions.map((definition) => {
      const settingValue = valuesByDefinitionKey[definition.key];

      return {
        definition,
        settingValue,
        getConfirmationMessage: SETTING_CONFIRMATION_MESSAGE_IDS[definition.key],
      };
    });

    this.setState({ settings });
  }

  render() {
    const { category, component, subCategory, displaySubCategoryTitle, noPadding } = this.props;
    const { settings } = this.state;

    return (
      <SubCategoryDefinitionsList
        category={category}
        component={component}
        displaySubCategoryTitle={displaySubCategoryTitle}
        noPadding={noPadding}
        settings={settings}
        subCategory={subCategory}
      />
    );
  }
}
