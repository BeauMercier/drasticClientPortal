/**
 * React Types
 * 
 * Common React type definitions used throughout the application.
 * This helps avoid importing React directly in many files.
 */

import type {
  ReactNode as ReactNodeType,
  ReactElement as ReactElementType,
  SyntheticEvent as SyntheticEventType,
  MouseEvent as MouseEventType,
  ReactPortal as ReactPortalType,
  ChangeEvent as ChangeEventType,
  FormEvent as FormEventType,
  FocusEvent as FocusEventType,
  KeyboardEvent as KeyboardEventType
} from 'react';

/**
 * React child node types
 */
export type ReactNode = ReactNodeType;

/**
 * React element type
 */
export type ReactElement = ReactElementType;

/**
 * React portal type
 */
export type ReactPortal = ReactPortalType;

/**
 * Common React event types
 */
export type SyntheticEvent<T = Element> = SyntheticEventType<T>;
export type MouseEvent<T = Element> = MouseEventType<T>;
export type ChangeEvent<T = Element> = ChangeEventType<T>;
export type FormEvent<T = Element> = FormEventType<T>;
export type FocusEvent<T = Element> = FocusEventType<T>;
export type KeyboardEvent<T = Element> = KeyboardEventType<T>;

/**
 * Utility types
 */
export type ReactFC<P = {}> = (props: P) => ReactElement | null;
export type ReactFCWithChildren<P = {}> = (props: P & { children?: ReactNode }) => ReactElement | null; 