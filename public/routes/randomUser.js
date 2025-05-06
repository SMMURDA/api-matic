const { faker } = require('@faker-js/faker');

module.exports = async function (req, res) {
  try {
    const user = {
      id: faker.string.uuid(),
      name: faker.person.fullName(),
      gender: faker.person.sexType(),
      email: faker.internet.email(),
      username: faker.internet.userName(),
      phone: faker.phone.number(),
      birthdate: faker.date.birthdate({ min: 18, max: 65, mode: 'age' }),
      address: {
        street: faker.location.streetAddress(),
        city: faker.location.city(),
        state: faker.location.state(),
        country: faker.location.country(),
        zip: faker.location.zipCode(),
      },
      avatar: faker.image.avatar(),
      job: {
        title: faker.person.jobTitle(),
        type: faker.person.jobType(),
      },
      website: faker.internet.url(),
    };

    res.json({ success: true, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Gagal membuat user acak' });
  }
};
