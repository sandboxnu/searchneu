import React, { ReactElement } from 'react';
import Colors from '../../styles/_exports.module.scss';

const IconClose = ({
  fill = Colors.white,
}: {
  fill?: string;
}): ReactElement => (
  <svg viewBox="0 0 9 9" fill={fill} xmlns="http://www.w3.org/2000/svg">
    <path d="M8.59468 0.201347C8.533 0.139545 8.45974 0.0905129 8.3791 0.0570586C8.29845 0.0236043 8.21199 0.00638421 8.12468 0.00638421C8.03737 0.00638421 7.95091 0.0236043 7.87026 0.0570586C7.78961 0.0905129 7.71636 0.139545 7.65468 0.201347L4.39468 3.45468L1.13468 0.19468C1.07296 0.132959 0.999685 0.0839989 0.919043 0.0505956C0.8384 0.0171923 0.751968 6.50339e-10 0.66468 0C0.577393 -6.5034e-10 0.490961 0.0171923 0.410318 0.0505956C0.329675 0.0839989 0.256401 0.132959 0.19468 0.19468C0.132959 0.256401 0.0839989 0.329675 0.0505956 0.410318C0.0171923 0.490961 -6.50339e-10 0.577393 0 0.66468C6.5034e-10 0.751967 0.0171923 0.8384 0.0505956 0.919042C0.0839989 0.999685 0.132959 1.07296 0.19468 1.13468L3.45468 4.39468L0.19468 7.65468C0.132959 7.7164 0.0839989 7.78967 0.0505956 7.87032C0.0171923 7.95096 0 8.03739 0 8.12468C0 8.21197 0.0171923 8.2984 0.0505956 8.37904C0.0839989 8.45968 0.132959 8.53296 0.19468 8.59468C0.256401 8.6564 0.329675 8.70536 0.410318 8.73876C0.490961 8.77217 0.577393 8.78936 0.66468 8.78936C0.751968 8.78936 0.8384 8.77217 0.919043 8.73876C0.999685 8.70536 1.07296 8.6564 1.13468 8.59468L4.39468 5.33468L7.65468 8.59468C7.7164 8.6564 7.78968 8.70536 7.87032 8.73876C7.95096 8.77217 8.03739 8.78936 8.12468 8.78936C8.21197 8.78936 8.2984 8.77217 8.37904 8.73876C8.45969 8.70536 8.53296 8.6564 8.59468 8.59468C8.6564 8.53296 8.70536 8.45968 8.73876 8.37904C8.77217 8.2984 8.78936 8.21197 8.78936 8.12468C8.78936 8.03739 8.77217 7.95096 8.73876 7.87032C8.70536 7.78967 8.6564 7.7164 8.59468 7.65468L5.33468 4.39468L8.59468 1.13468C8.84801 0.881347 8.84801 0.45468 8.59468 0.201347Z" />
  </svg>
);

export default IconClose;
