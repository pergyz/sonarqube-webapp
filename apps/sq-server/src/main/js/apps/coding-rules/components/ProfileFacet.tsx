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

import styled from '@emotion/styled';
import { Text } from '@sonarsource/echoes-react';
import { sortBy } from 'lodash';
import * as React from 'react';
import { FacetBox, FacetItem, Note, themeColor } from '~design-system';
import { FacetHelp } from '~sq-server-commons/components/facets/FacetHelp';
import { FacetItemsList } from '~sq-server-commons/components/facets/FacetItemsList';
import { DocLink } from '~sq-server-commons/helpers/doc-links';
import { translate } from '~sq-server-commons/helpers/l10n';
import { CodingRulesQuery } from '~sq-server-commons/types/coding-rules';
import { BaseProfile } from '~sq-server-commons/types/quality-profiles';
import { FacetKey } from '~sq-server-commons/utils/coding-rules-query';

interface Props {
  activation: boolean | undefined;
  compareToProfile: string | undefined;
  languages: string[];
  onChange: (changes: Partial<CodingRulesQuery>) => void;
  onToggle: (facet: FacetKey) => void;
  open: boolean;
  referencedProfiles: Record<string, BaseProfile>;
  value: string | undefined;
}

export default class ProfileFacet extends React.PureComponent<Props> {
  handleItemClick = (selected: string) => {
    const newValue = this.props.value === selected ? '' : selected;
    this.props.onChange({
      activation: this.props.activation === undefined ? true : this.props.activation,
      compareToProfile: undefined,
      profile: newValue,
    });
  };

  handleHeaderClick = () => {
    this.props.onToggle('profile');
  };

  handleClear = () => {
    this.props.onChange({
      activation: undefined,
      compareToProfile: undefined,
      inheritance: undefined,
      profile: undefined,
    });
  };

  handleActiveClick = (event: React.SyntheticEvent<HTMLElement>) => {
    this.stopPropagation(event);
    this.props.onChange({ activation: true, compareToProfile: undefined });
  };

  handleInactiveClick = (event: React.SyntheticEvent<HTMLElement>) => {
    this.stopPropagation(event);
    this.props.onChange({ activation: false, compareToProfile: undefined });
  };

  stopPropagation = (event: React.SyntheticEvent<HTMLElement>) => {
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.blur();
  };

  getTextValue = () => {
    const { referencedProfiles, value } = this.props;
    if (value) {
      const profile = referencedProfiles[value];
      const name = (profile && `${profile.name} ${profile.languageName}`) || value;
      return [name];
    }
    return [];
  };

  getTooltip = (profile: BaseProfile) => {
    const base = `${profile.name} ${profile.languageName}`;
    return profile.isBuiltIn ? `${base} (${translate('quality_profiles.built_in')})` : base;
  };

  renderName = (profile: BaseProfile) => (
    <>
      {profile.name}
      <Note className="sw-ml-1">
        {profile.languageName}
        {profile.isBuiltIn && ` (${translate('quality_profiles.built_in')})`}
      </Note>
    </>
  );

  renderActivation = (profile: BaseProfile) => {
    const isCompare = profile.key === this.props.compareToProfile;
    const activation = isCompare ? true : this.props.activation;
    return (
      <>
        <FacetToggleActiveStyle
          aria-checked={activation}
          className="js-active sw-typo-sm"
          onClick={isCompare ? this.stopPropagation : this.handleActiveClick}
          role="radio"
          selected={!!activation}
          tabIndex={-1}
        >
          active
        </FacetToggleActiveStyle>
        <FacetToggleInActiveStyle
          aria-checked={!activation}
          className="js-inactive sw-typo-sm sw-ml-1"
          onClick={isCompare ? this.stopPropagation : this.handleInactiveClick}
          role="radio"
          selected={!activation}
          tabIndex={-1}
        >
          inactive
        </FacetToggleInActiveStyle>
      </>
    );
  };

  renderItem = (profile: BaseProfile) => {
    const active = [this.props.value, this.props.compareToProfile].includes(profile.key);

    return (
      <FacetItem
        active={active}
        className="it__search-navigator-facet"
        key={profile.key}
        name={this.renderName(profile)}
        onClick={this.handleItemClick}
        stat={active ? this.renderActivation(profile) : null}
        tooltip={this.getTooltip(profile)}
        value={profile.key}
      />
    );
  };

  render() {
    const { languages, open, referencedProfiles, value } = this.props;
    let profiles = Object.values(referencedProfiles);
    if (languages.length > 0) {
      profiles = profiles.filter((profile) => languages.includes(profile.language));
    }
    profiles = sortBy(
      profiles,
      (profile) => profile.name.toLowerCase(),
      (profile) => profile.languageName,
    );

    const property = 'profile';
    const headerId = `facet_${property}`;
    const count = value ? 1 : undefined;
    const hasEditRights = Object.values(referencedProfiles).some(
      (profile) => profile.actions?.edit,
    );

    return (
      <FacetBox
        className="it__search-navigator-facet-box"
        count={count}
        data-property={property}
        help={
          <FacetHelp
            description={
              <>
                {translate('coding_rules.facet.qprofile.help.desc')}
                {!hasEditRights && (
                  <p className="sw-mt-4">{translate('coding_rules.facet.qprofile.help.extra')}</p>
                )}
              </>
            }
            link={DocLink.InstanceAdminQualityProfiles}
            linkText={translate('coding_rules.facet.qprofile.help.learn_more')}
            title={translate('coding_rules.facet.qprofile.help.title')}
          />
        }
        id={headerId}
        name={translate('coding_rules.facet.qprofile')}
        onClear={this.handleClear}
        onClick={this.handleHeaderClick}
        open={open}
      >
        {hasEditRights && (
          <Text as="p" className="sw-mt-2 sw-mb-4" isSubdued>
            {translate('coding_rules.facet.qprofile.help.extra')}
          </Text>
        )}
        {open && (
          <FacetItemsList labelledby={headerId}>{profiles.map(this.renderItem)}</FacetItemsList>
        )}
      </FacetBox>
    );
  }
}

const FacetToggleActiveStyle = styled.span<{ selected: boolean }>`
  background-color: ${(props) =>
    props.selected ? themeColor('facetToggleActive') : 'transparent'};
  color: ${(props) => (props.selected ? '#fff' : undefined)};
  padding: 2px;
  border-radius: 4px;
`;

const FacetToggleInActiveStyle = styled.span<{ selected: boolean }>`
  background-color: ${(props) =>
    props.selected ? themeColor('facetToggleInactive') : 'transparent'};
  color: ${(props) => (props.selected ? '#fff' : undefined)};
  padding: 2px;
  border-radius: 4px;
`;
