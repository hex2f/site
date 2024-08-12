---
title: Saving precious bytes by storing ULID strings as binary with Drizzle
date: 2024-03-21
excerpt: How to store ULIDs as binary data in MySQL databases while still working with strings in your application code using Drizzle's custom column types.
---

I recently read [The problem with using UUID primary key in MySQL](https://planetscale.com/blog/the-problem-with-using-a-uuid-primary-key-in-mysql) by [PlanetScale](https://planetscale.com/) where they argue the benefits of using auto-incrementing integers as primary keys in MySQL databases. I am not a fan of this approach, as it's hard to ensure unique IDs across multiple databases without some sort of central ID authority.

*However*, that's not the only point this article makes. It also underlines the importance of IDs that follow a predictable and sequential order. Mainly for performance reasons, as it allows for better storage utilization and smaller, faster indexes (with fully random IDs, InnoDB may only use **50% of the available space** in each page!).

Therefore I prefer [ULID](https://github.com/ulid/spec), which promises to offer (as its name implies) *"Universally Unique Lexicographically Sortable Identifiers"*. In my opinion, this is a great compromise between fully random UUIDs and auto-incrementing integers (I also find them to be quite pretty :p). But there's a problem with how most people store ULIDs in databases: *as strings*. 😱

This is a big waste of memory, as ULIDs are just 128 bits, or 16 bytes long. Storing them as `CHAR(26)` will use **72 bytes** if you're using the default `utf8mb4` encoding in MySQL. That's **4.5 times more** than if youre using a binary column! It's understandable that most people do this, as it's way easier to work with strings than with binary data in most programming languages. But what if I told you that you can have the best of both worlds?

**Intoducing:** [Custom column types in Drizzle](https://orm.drizzle.team/docs/custom-types)! With this feature, you can define your own column types and how they are de/serialized. This allows you to store ULIDs as binary data in the database, while still working with strings in your application code.

```ts
import * as base32 from "@0x57/base32";
import { sql, type SQL } from "drizzle-orm";
import { customType } from "drizzle-orm/mysql-core";

// Utility function to convert a Uint8Array to a hex string
function bytestohex(bytes: Uint8Array): string {
	var hex = '';
	for (var i = 0; i < bytes.length; i++)
		hex += ('0' + (bytes[i] & 0xFF).toString(16)).slice(-2);
	return hex;
}

export const binaryBase32 = customType<{
	data: string;
	config: { length?: number };
	driverData: string;
}>({

	// The data type that will be used in the database
	dataType(config) {
		return config?.length ? `BINARY(${config.length})` : "BINARY";
	},

	// The value that will be sent in queries to the database
	toDriver(value: string): SQL {
		// First, let's encode the base32 string to a buffer
		const buffer = new Uint8Array(base32.decode(value));
		// Then, let's convert the buffer to a hex string
		const hex = bytestohex(buffer);
		// Which we'll return as a raw SQL string
		return sql.raw(`x'${hex}'`);
	},

	// The value that will be returned from the database
	fromDriver(value: string): string {
		// MySQL returns binary data as a utf8 encoded string
		// So lets decode it back into a Uint8Array
		const buffer = Uint8Array.from(str, (c) => c.charCodeAt(0));
		// And encode it as a base32 string
		return base32.encode(buffer);
	}
});
```

But **there's a problem with this code**. Our Uint8Array will actually be 17 bytes, not 16. This is because ULIDs are 128 bits long, and base32 encoding uses 5 bits per character. And guess what, 128 is not divisible by 5!

An easy way to fix this is by first padding the ULID with zeroes to 32 characters, then slicing the first four bytes after decoding it. This way, we'll always have a 16-byte buffer.

```ts
toDriver(value: string): SQL {
	// Pad the ULID with zeroes to 32 characters
	const padded = value.padEnd(32, '0');
	const buffer = new Uint8Array(base32.decode(value));
	// Slice after the first 4 bytes and convert to hex
	const hex = bytestohex(buffer.slice(4));
	return sql.raw(`x'${hex}'`);
}
```

When re-encoding our buffer back into a base32 string, we'll also have to pad the buffer with zeroes before encoding it to ensure the bytes line up with the original ULID.

```ts
fromDriver(value: string): string {
	const buffer = Uint8Array.from(str, (c) => c.charCodeAt(0));
	// Pad the buffer with 4 zero bytes
	const padded = new Uint8Array([0, 0, 0, 0, ...buffer]);
	// Encode the padded buffer and get the last 26 characters
	return base32.encode(padded).slice(-26);
}
```

Now we can use this custom column type in your Drizzle schema:

```ts
import { ulid } from '@0x57/ulid';
import { mysqlTable, varchar } from "drizzle-orm/mysql-core";

export const users = mysqlTable(
	"users",
	{
		id: binaryBase32("id", { length: 16 })
			.notNull()
			.primaryKey()
			.$defaultFn(() => ulid()),
		name: varchar("name", { length: 256 }),
		email: varchar("email", { length: 256 })
	}
);
```

And that's it! Now you can store ULIDs as binary data in your database, while still working with strings in your application code. 

Now, let's see how we can use this in our application code:

```ts
import { users } from "./schema";
import { db } from "./db";

await db.insert(users).values({
	name: "Leah",
	email: "leah@pigeon.sh"
})

const user = await db
	.select({ id: users.id })
	.from(users)
	.where(eq(users.email, "leah@pigeon.sh"));

                                 // "01HSF4ESKKTVHKREJMEXDWYE5F"
console.log("Created user with ID:", user.id);
```

And the best part? This technique can be used with any binary data while still working with strings in your application code, not just ULIDs! (*but please, don't store massive blobs in your database, that's what object storage is for!* 😭)
