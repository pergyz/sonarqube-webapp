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

import { searchProjects } from '~sq-server-commons/api/components';
import { ONE_SECOND } from '~sq-server-commons/helpers/constants';
import { mockComponent } from '~sq-server-commons/helpers/mocks/component';
import {
  convertToSorting,
  FACETS,
  LEAK_FACETS,
  LEGACY_FACETS,
  LEGACY_LEAK_FACETS,
} from '~sq-server-commons/helpers/projects';
import { Component } from '~sq-server-commons/types/types';
import * as utils from '../utils';

jest.mock('~sq-server-commons/api/components', () => ({
  searchProjects: jest
    .fn()
    .mockResolvedValue({ components: [], facets: [], paging: { total: 10 } }),
  getScannableProjects: jest.fn().mockResolvedValue({ projects: [] }),
}));

describe('localizeSorting', () => {
  it('localizes default sorting', () => {
    expect(utils.localizeSorting()).toBe('projects.sort.name');
  });

  it('localizes custom sorting', () => {
    expect(utils.localizeSorting('size')).toBe('projects.sort.size');
  });
});

describe('parseSorting', () => {
  it('parses ascending', () => {
    expect(utils.parseSorting('size')).toEqual({ sortDesc: false, sortValue: 'size' });
  });

  it('parses descending', () => {
    expect(utils.parseSorting('-size')).toEqual({ sortDesc: true, sortValue: 'size' });
  });
});

describe('formatDuration', () => {
  const ONE_MINUTE = 60 * ONE_SECOND;
  const ONE_HOUR = 60 * ONE_MINUTE;
  const ONE_DAY = 24 * ONE_HOUR;
  const ONE_MONTH = 30 * ONE_DAY;
  const ONE_YEAR = 12 * ONE_MONTH;

  it('render years and months only', () => {
    expect(utils.formatDuration(ONE_YEAR * 4 + ONE_MONTH * 2 + ONE_DAY * 10)).toEqual(
      'duration.years.4 duration.months.2 ',
    );
  });

  it('render years only', () => {
    expect(utils.formatDuration(ONE_YEAR * 4 + ONE_DAY * 10)).toEqual('duration.years.4 ');
  });

  it('render hours and minutes', () => {
    expect(utils.formatDuration(ONE_HOUR * 4 + ONE_MINUTE * 10)).toEqual(
      'duration.hours.4 duration.minutes.10 ',
    );
  });

  it('render days only', () => {
    expect(utils.formatDuration(ONE_DAY * 4 + ONE_MINUTE * 10)).toEqual('duration.days.4 ');
  });

  it('render less than a minute', () => {
    expect(utils.formatDuration(ONE_SECOND)).toEqual('duration.seconds');
  });
});

describe('fetchProjects', () => {
  it('correctly converts the passed arguments to the desired query format', async () => {
    await utils.fetchProjects({ isFavorite: true, query: {}, isStandardMode: true });

    expect(searchProjects).toHaveBeenCalledWith({
      f: 'analysisDate,leakPeriodDate',
      facets: LEGACY_FACETS.join(),
      filter: 'isFavorite',
      p: undefined,
      ps: 50,
    });

    await utils.fetchProjects({
      isFavorite: false,
      pageIndex: 3,
      query: {
        view: 'leak',
        new_reliability: 6,
        incorrect_property: 'should not appear in post data',
        search: 'foo',
      },
      isStandardMode: true,
    });

    expect(searchProjects).toHaveBeenCalledWith({
      f: 'analysisDate,leakPeriodDate',
      facets: LEGACY_LEAK_FACETS.join(),
      filter: 'new_reliability_rating = 6 and query = "foo"',
      p: 3,
      ps: 50,
    });
  });

  it('correctly converts the passed arguments to the desired query format for non legacy', async () => {
    await utils.fetchProjects({ isFavorite: true, query: {}, isStandardMode: false });

    expect(searchProjects).toHaveBeenCalledWith({
      f: 'analysisDate,leakPeriodDate',
      facets: FACETS.join(),
      filter: 'isFavorite',
      p: undefined,
      ps: 50,
    });

    await utils.fetchProjects({
      isFavorite: false,
      pageIndex: 3,
      query: {
        view: 'leak',
        new_reliability: 6,
        incorrect_property: 'should not appear in post data',
        search: 'foo',
      },
      isStandardMode: false,
    });

    expect(searchProjects).toHaveBeenCalledWith({
      f: 'analysisDate,leakPeriodDate',
      facets: LEAK_FACETS.join(),
      filter: 'new_software_quality_reliability_rating = 6 and query = "foo"',
      p: 3,
      ps: 50,
    });
  });

  it('correctly treats result data', async () => {
    const components = [mockComponent({ key: 'foo' }), mockComponent({ key: 'bar' })];

    (searchProjects as jest.Mock).mockResolvedValue({
      components,
      facets: [
        { property: 'new_coverage', values: [{ val: 'NO_DATA', count: 0 }] },
        {
          property: 'languages',
          values: [
            { val: 'css', count: 10 },
            { val: 'js', count: 2 },
          ],
        },
      ],
      paging: { total: 2 },
    });

    await utils.fetchProjects({ isFavorite: true, query: {}, isStandardMode: true }).then((r) => {
      expect(r).toEqual({
        facets: {
          new_coverage: { NO_DATA: 0 },
          languages: { css: 10, js: 2 },
        },
        projects: components.map(
          (
            component: Component & {
              isScannable: boolean;
              measures: { languages?: string; new_coverage?: string };
            },
          ) => {
            component.isScannable = false;
            return component;
          },
        ),

        total: 2,
      });
    });
  });
});

describe('defineMetrics', () => {
  it('returns the correct list of metrics', () => {
    expect(utils.defineMetrics({ view: 'leak' })).toBe(utils.LEAK_METRICS);
    expect(utils.defineMetrics({ view: 'overall' })).toBe(utils.METRICS);
    expect(utils.defineMetrics({})).toBe(utils.METRICS);
  });
});

describe('convertToSorting', () => {
  it('handles asc and desc sort', () => {
    expect(convertToSorting({ sort: '-size' }, true)).toStrictEqual({
      asc: false,
      s: 'ncloc',
    });
    expect(convertToSorting({}, true)).toStrictEqual({ s: undefined });
    expect(convertToSorting({ sort: 'search' }, true)).toStrictEqual({ s: 'query' });
  });

  it('handles sort for legacy and non legacy queries', () => {
    expect(convertToSorting({ sort: '-reliability' }, true)).toStrictEqual({
      asc: false,
      s: 'reliability_rating',
    });
    expect(convertToSorting({ sort: '-reliability' }, false)).toStrictEqual({
      asc: false,
      s: 'software_quality_reliability_rating',
    });
  });
});
