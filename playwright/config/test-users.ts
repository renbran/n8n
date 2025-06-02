import { randFirstName, randLastName } from '@ngneat/falso';

import { DEFAULT_USER_PASSWORD } from './constants';

export interface UserCredentials {
	email: string;
	password: string;
	firstName: string;
	lastName: string;
}

export const INSTANCE_OWNER_CREDENTIALS: UserCredentials = {
	email: 'nathan@n8n.io',
	password: DEFAULT_USER_PASSWORD,
	firstName: randFirstName(),
	lastName: randLastName(),
};

export const INSTANCE_ADMIN_CREDENTIALS: UserCredentials = {
	email: 'admin@n8n.io',
	password: DEFAULT_USER_PASSWORD,
	firstName: randFirstName(),
	lastName: randLastName(),
};

export const INSTANCE_MEMBER_CREDENTIALS: UserCredentials[] = [
	{
		email: 'member@n8n.io',
		password: DEFAULT_USER_PASSWORD,
		firstName: randFirstName(),
		lastName: randLastName(),
	},
];
