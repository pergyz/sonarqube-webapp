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

import { memoize } from 'lodash';
import { RawQuery } from '~shared/types/router';
import { cleanQuery, parseAsString, serializeString } from '~sq-server-commons/helpers/query';

export interface Query {
  managed?: boolean;
  search: string;
}

export const parseQuery = memoize(
  (urlQuery: RawQuery): Query => ({
    search: parseAsString(urlQuery.search),
    managed: urlQuery.managed !== undefined ? urlQuery.managed === 'true' : undefined,
  }),
);

export const serializeQuery = memoize(
  (query: Query): RawQuery =>
    cleanQuery({
      search: query.search ? serializeString(query.search) : undefined,
      managed: query.managed,
    }),
);
