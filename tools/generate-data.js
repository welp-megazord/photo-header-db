#!/usr/bin/env node

const faker = require('faker');

const recordCount = 10000000;
const addressFormat = '{{address.streetAddress}}, {{address.city}} {{address.stateAbbr}}, {{address.zipCode}}';

const unique = (fn) => {
  const seen = new Set();
  return (...args) => {
    const result = fn(...args);
    if (!seen.has(result)) {
      seen.add(result);
      return result;
    }
    const tries = 50;
    const start = Math.floor(Math.random() * 100);
    for (let i = 1; i <= tries; i++) {
      const value = result + '_' + (start + i);
      if (!seen.has(value)) {
        seen.add(value);
        return value;
      }
    }
    throw new Error(`Failed to generate unique value after ${tries} tries`);
  };
};

const generateUsers = function*(count) {
  const userName = unique(faker.internet.userName);
  for (let i = 0; i < count; i++) {
    yield [i + 1, userName()];
  }
};

const generatePhotos = function*(count) {
  for (let i = 0; i < count; i++) {
    yield [
      i + 1,
      faker.image.business(),
      faker.lorem.words(),
      Math.floor(Math.random() * count) + 1,
      Math.floor(Math.random() * count) + 1
    ];
  }
};

const generateRestaurants = function*(count) {
  for (let i = 0; i < count; i++) {
    yield [
      // i + 1,
      faker.company.companyName(),
      faker.fake(addressFormat),
      faker.phone.phoneNumber('(###) ###-####'),
      faker.internet.url(),
      faker.internet.url(),
      faker.lorem.words()
    ];
  }
};

const generateUsersRestaurants = function*(count) {
  for (let i = 0; i < count; i++) {
    yield [i + 1, count - i];
  }
};

const generateToStream = (generator, stream = null) => {
  stream = stream || process.stdout;
  // Pause every 1,000,000 lines and re-schedule with `process.nextTick`
  //
  // This is because:
  // - I want to write to stdout
  // - This script's caller wants to redirect stdout to a file
  // - When stdout is redirected to a file, it uses an unbounded buffer, thus
  //   - Writes never block or fail; `drain` events are no help
  //   - Memory usage grows with every buffered write, until we either finish
  //     or the heap is exhausted
  // - Getting back to the event loop allows the buffer to be drained
  //   and thereby prevents it from exhausting the heap
  for (let i = 0; i < 1000000; i++) {
    const { value, done } = generator.next();
    if (done) {
      return;
    }
    stream.write(value.join('\t') + '\n');
  }
  process.nextTick(() => generateToStream(generator, stream));
};

const run = (args) => {
  let table, count, generator;

  switch (args.length) {
  case 1:
    [ table, count ] = [ ...args, recordCount ];
    break;
  case 2:
    [ table, count ] = args;
    break;
  default:
    console.error('Usage: generate-data.js TABLE [COUNT]');
    process.exit(1);
  }

  switch (table) {
  case 'users':
    generator = generateUsers;
    break;
  case 'photos':
    generator = generatePhotos;
    break;
  case 'restaurants':
    generator = generateRestaurants;
    break;
  case 'users_restaurants':
    generator = generateUsersRestaurants;
    break;
  default:
    console.error(`Unknown table ${table}`);
    process.exit(1);
  }

  generateToStream(generator(count));
};

if (require.main === module) {
  // Slice off `node` and the script
  const args = process.argv.slice(2);
  run(args);
}

module.exports = {
  generateUsers,
  generatePhotos,
  generateRestaurants,
  generateUsersRestaurants,
  generateToStream,
  run
};
