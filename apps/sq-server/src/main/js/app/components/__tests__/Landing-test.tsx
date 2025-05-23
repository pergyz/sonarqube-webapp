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

import { mockCurrentUser, mockLoggedInUser } from '~sq-server-commons/helpers/testMocks';
import { renderApp } from '~sq-server-commons/helpers/testReactTestingUtils';
import { byText } from '~sq-server-commons/sonar-aligned/helpers/testSelector';
import { CurrentUser } from '~sq-server-commons/types/users';
import { Landing, LandingProps } from '../Landing';

it.each([
  ['user not logged in', mockCurrentUser()],
  ['user has no homepage', mockLoggedInUser({ homepage: undefined })],
])('should redirect to projects (%s)', (_, currentUser: CurrentUser) => {
  renderLanding({ currentUser });
  expect(byText('/projects').get()).toBeInTheDocument();
});

it('should redirect to homepage', () => {
  renderLanding({
    currentUser: mockLoggedInUser({
      homepage: { type: 'PROJECT', branch: undefined, component: 'pk1' },
    }),
  });
  expect(byText('/dashboard?id=pk1').get()).toBeInTheDocument();
});

function renderLanding(props: Partial<LandingProps> = {}) {
  return renderApp('/', <Landing currentUser={mockCurrentUser()} {...props} />);
}
