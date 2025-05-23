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

import { AiCodeAssuranceStatus } from '../../api/ai-code-assurance';
import { ShieldCheckIcon } from '../ui/icon/ShieldCheckIcon';
import { ShieldCrossIcon } from '../ui/icon/ShieldCrossIcon';
import { ShieldOffIcon } from '../ui/icon/ShieldOffIcon';
import { ShieldOnIcon } from '../ui/icon/ShieldOnIcon';

export enum AiIconColor {
  Disable = '--echoes-color-icon-disabled',
  Default = '--echoes-color-icon-default',
  Accent = '--echoes-color-icon-accent',
  Subdued = '--echoes-color-icon-subdued',
}

export enum AiIconVariant {
  On,
  Off,
  Check,
  Cross,
}

interface Props {
  className?: string;
  color?: AiIconColor;
  height?: number;
  variant?: Exclude<AiCodeAssuranceStatus, AiCodeAssuranceStatus.NONE>;
  width?: number;
}

const VariantComp = {
  [AiCodeAssuranceStatus.AI_CODE_ASSURED_PASS]: ShieldCheckIcon,
  [AiCodeAssuranceStatus.AI_CODE_ASSURED_ON]: ShieldOnIcon,
  [AiCodeAssuranceStatus.AI_CODE_ASSURED_FAIL]: ShieldCrossIcon,
  [AiCodeAssuranceStatus.AI_CODE_ASSURED_OFF]: ShieldOffIcon,
};

export default function AIAssuredIcon({
  color,
  variant = AiCodeAssuranceStatus.AI_CODE_ASSURED_ON,
  className,
  width = 20,
  height = 20,
}: Readonly<Props>) {
  const Comp = VariantComp[variant];
  return (
    <Comp className={className} fill={color && `var(${color})`} height={height} width={width} />
  );
}
