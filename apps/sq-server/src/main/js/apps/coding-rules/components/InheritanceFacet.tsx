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

import * as React from 'react';
import { RuleInheritance } from '~shared/types/rules';
import Facet, { BasicProps } from '~sq-server-commons/components/facets/Facet';
import { translate } from '~sq-server-commons/helpers/l10n';

interface Props extends Omit<BasicProps, 'values'> {
  disabled: boolean;
  value: RuleInheritance | undefined;
}

export default class InheritanceFacet extends React.PureComponent<Props> {
  renderName = (value: RuleInheritance) =>
    translate('coding_rules.filters.inheritance', value.toLowerCase());

  render() {
    const { value, ...props } = this.props;

    return (
      <Facet
        {...props}
        disabled={this.props.disabled}
        disabledHelper={translate('coding_rules.filters.inheritance.inactive')}
        options={['NONE', 'INHERITED', 'OVERRIDES']}
        property="inheritance"
        renderName={this.renderName}
        renderTextName={this.renderName}
        singleSelection
        values={value ? [value] : []}
      />
    );
  }
}
