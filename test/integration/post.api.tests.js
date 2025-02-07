const assert = require('assert');
const util = require('util');
const request = require('request');

const { ADMIN_USER, cleanup, URL_PREFIX } = require('../fixtures.js');
const api = require('../api-client.js');
const { START_WITH_ENV_FILE } = process.env;
const { startOpenwhydServer } = require('../approval-tests-helpers');
const randomString = () => Math.random().toString(36).substring(2, 9);

describe(`post api`, function () {
  let post;
  let jar;
  let context = {};

  before(cleanup); // to prevent side effects between test suites
  before(async () => {
    if (START_WITH_ENV_FILE) {
      context.serverProcess = await startOpenwhydServer({
        startWithEnv: START_WITH_ENV_FILE,
      });
    }
  });
  after(async () => {
    await context.serverProcess?.exit();
  });
  beforeEach(async () => {
    post = {
      eId: `/yt/${randomString()}`,
      name: `Lullaby - Jack Johnson and Matt Costa`,
    };

    ({ jar } = await util.promisify(api.loginAs)(ADMIN_USER));
    /* FIXME: We are forced to use the ADMIN_USER, since DUMMY_USER is mutated by user.api.tests.js and the db cleanup seems to not work for the users collection.
     * May be initdb_testing.js is not up to date with the current schema?
     */
  });

  it("should edit a track's name", async function () {
    const { body } = await api.addPost(jar, post);
    const pId = body._id;
    const newName = 'coucou';
    await new Promise((resolve, reject) =>
      request.post(
        {
          jar,
          form: {
            action: 'insert',
            eId: post.eId,
            name: newName,
            _id: pId,
            pl: { id: null, name: 'full stream' },
          },
          url: `${URL_PREFIX}/api/post`,
        },
        (error, response, body) =>
          error ? reject(error) : resolve({ response, body })
      )
    );
    const res = await new Promise((resolve, reject) =>
      request.get(
        `${URL_PREFIX}/c/${pId}?format=json`,
        (error, response, body) =>
          error ? reject(error) : resolve({ response, body })
      )
    );
    const { data: postedTrack } = JSON.parse(res.body);
    assert.equal(postedTrack.name, newName);
    assert.equal(postedTrack.eId, post.eId);
  });

  it('should add a track', async function () {
    const name = randomString();
    const ctx = 'bk';

    const res = await new Promise((resolve, reject) =>
      request.post(
        {
          jar,
          form: {
            action: 'insert',
            eId: post.eId,
            name: name,
            ctx: ctx,
            pl: { id: null, name: 'full stream' },
          },
          url: `${URL_PREFIX}/api/post`,
        },
        (error, response, body) =>
          error ? reject(error) : resolve({ response, body })
      )
    );
    const postedTrack = JSON.parse(res.body);
    assert.equal(postedTrack.name, name);
    assert.equal(postedTrack.eId, post.eId);
    assert.equal(postedTrack.ctx, ctx);
    assert.equal(postedTrack.isNew, true);
    assert.equal(postedTrack.uId, ADMIN_USER.id);
    assert.equal(postedTrack.uNm, ADMIN_USER.name);
    assert.ok(postedTrack._id);
    assert.equal(postedTrack.pl, undefined);
  });

  it('should add a track to an existing playlist', async function () {
    const postWithPlaylist = {
      ...post,
      pl: { id: 'create', name: randomString() },
    };

    const { body } = await api.addPost(jar, postWithPlaylist);
    const pId = body._id;
    const name = body.name;
    const ctx = 'bk';
    const playlist = body.pl;
    const description = 'this is a description';

    await new Promise((resolve, reject) =>
      request.post(
        {
          jar,
          form: {
            action: 'insert',
            eId: post.eId,
            name: name,
            _id: pId,
            ctx: ctx,
            pl: { id: playlist.id, name: playlist.name },
            text: description,
          },
          url: `${URL_PREFIX}/api/post`,
        },
        (error, response, body) =>
          error ? reject(error) : resolve({ response, body })
      )
    );
    const res = await new Promise((resolve, reject) =>
      request.get(
        `${URL_PREFIX}/c/${pId}?format=json`,
        (error, response, body) =>
          error ? reject(error) : resolve({ response, body })
      )
    );
    const { data: postedTrack } = JSON.parse(res.body);
    assert.equal(postedTrack.name, name);
    assert.equal(postedTrack.eId, post.eId);
    assert.equal(postedTrack.ctx, ctx);
    assert.equal(postedTrack.pl.id, playlist.id);
    assert.equal(postedTrack.pl.name, playlist.name);
    assert.equal(postedTrack.text, description);
    assert.equal(postedTrack.uId, ADMIN_USER.id);
    assert.equal(postedTrack.uNm, ADMIN_USER.name);
  });

  it('should add a track to a new playlist', async function () {
    const name = randomString();
    const ctx = 'bk';
    const newPlayListName = randomString();

    const res = await new Promise((resolve, reject) =>
      request.post(
        {
          jar,
          form: {
            action: 'insert',
            eId: post.eId,
            name: name,
            ctx: ctx,
            pl: { id: 'create', name: newPlayListName },
          },
          url: `${URL_PREFIX}/api/post`,
        },
        (error, response, body) =>
          error ? reject(error) : resolve({ response, body })
      )
    );
    const postedTrack = JSON.parse(res.body);
    assert.equal(postedTrack.name, name);
    assert.equal(postedTrack.eId, post.eId);
    assert.equal(postedTrack.ctx, ctx);
    assert.equal(postedTrack.isNew, true);
    assert.equal(postedTrack.uId, ADMIN_USER.id);
    assert.equal(postedTrack.uNm, ADMIN_USER.name);
    assert.ok(postedTrack._id);
    assert.ok(postedTrack.pl.id);
    assert.equal(postedTrack.pl.name, newPlayListName);
  });

  it('should re-add a track into a new playlist', async function () {
    const { body } = await api.addPost(jar, post);
    const pId = body._id;
    const name = body.name;
    const ctx = 'bk';
    const newPlayListName = randomString();
    const description = 'this is a description';

    await new Promise((resolve, reject) =>
      request.post(
        {
          jar,
          form: {
            action: 'insert',
            eId: post.eId,
            name: name,
            _id: pId,
            ctx: ctx,
            pl: { id: 'create', name: newPlayListName },
            text: description,
          },
          url: `${URL_PREFIX}/api/post`,
        },
        (error, response, body) =>
          error ? reject(error) : resolve({ response, body })
      )
    );
    const res = await new Promise((resolve, reject) =>
      request.get(
        `${URL_PREFIX}/c/${pId}?format=json`,
        (error, response, body) =>
          error ? reject(error) : resolve({ response, body })
      )
    );
    const { data: postedTrack } = JSON.parse(res.body);
    assert.equal(postedTrack.name, name);
    assert.equal(postedTrack.eId, post.eId);
    assert.equal(postedTrack.ctx, ctx);
    assert.equal(postedTrack.pl.name, newPlayListName);
    assert.equal(postedTrack.text, description);
    assert.equal(postedTrack.uId, ADMIN_USER.id);
    assert.equal(postedTrack.uNm, ADMIN_USER.name);
  });

  it('should re-add a track to a new playlist from the stream or from the Tracks in the user profile', async function () {
    const { body } = await api.addPost(jar, post);
    const pId = body._id;
    const name = body.name;
    const newPlayListName = randomString();

    const res = await new Promise((resolve, reject) =>
      request.post(
        {
          jar,
          form: {
            action: 'insert',
            eId: post.eId,
            name: name,
            pId: pId,
            pl: { id: 'create', name: newPlayListName },
          },
          url: `${URL_PREFIX}/api/post`,
        },
        (error, response, body) =>
          error ? reject(error) : resolve({ response, body })
      )
    );

    const postedTrack = JSON.parse(res.body);

    assert.equal(postedTrack.name, name);
    assert.equal(postedTrack.eId, post.eId);
    assert.notEqual(postedTrack.pl.id, undefined);
    assert.equal(postedTrack.pl.name, newPlayListName);
    assert.equal(postedTrack.uId, ADMIN_USER.id);
    assert.equal(postedTrack.uNm, ADMIN_USER.name);
    assert.deepEqual(postedTrack.lov, []);
    assert.equal(postedTrack.text, '');
    assert.equal(postedTrack.nbP, 0);
    assert.equal(postedTrack.nbR, 0);

    assert.notEqual(postedTrack._id, pId);

    assert.equal(postedTrack.repost.pId, pId);
    assert.equal(postedTrack.repost.uId, ADMIN_USER.id);
    assert.equal(postedTrack.repost.uNm, ADMIN_USER.name);
  });

  it('should re-add a track into an existing playlist', async function () {
    const postWithPlaylist = {
      ...post,
      pl: { id: 'create', name: randomString() },
    };

    const { body } = await api.addPost(jar, postWithPlaylist);
    const pId = body._id;
    const name = body.name;
    const playlist = body.pl;

    const res = await new Promise((resolve, reject) =>
      request.post(
        {
          jar,
          form: {
            action: 'insert',
            eId: post.eId,
            name: name,
            pId: pId,
            pl: { id: playlist.id, name: playlist.name },
          },
          url: `${URL_PREFIX}/api/post`,
        },
        (error, response, body) =>
          error ? reject(error) : resolve({ response, body })
      )
    );

    const postedTrack = JSON.parse(res.body);

    assert.equal(postedTrack.name, name);
    assert.equal(postedTrack.eId, post.eId);
    assert.notEqual(postedTrack.pl.id, undefined);
    assert.equal(postedTrack.pl.id, playlist.id);
    assert.equal(postedTrack.pl.name, playlist.name);
    assert.equal(postedTrack.uId, ADMIN_USER.id);
    assert.equal(postedTrack.uNm, ADMIN_USER.name);
    assert.deepEqual(postedTrack.lov, []);
    assert.equal(postedTrack.text, '');
    assert.equal(postedTrack.nbP, 0);
    assert.equal(postedTrack.nbR, 0);

    assert.notEqual(postedTrack._id, pId);

    assert.equal(postedTrack.repost.pId, pId);
    assert.equal(postedTrack.repost.uId, ADMIN_USER.id);
    assert.equal(postedTrack.repost.uNm, ADMIN_USER.name);
  });

  it('should allow re-adding a track into another playlist', async function () {
    const postWithPlaylist = {
      ...post,
      pl: { id: 'create', name: randomString() },
    };

    const { body } = await api.addPost(jar, postWithPlaylist);
    const pId = body._id;
    const name = body.name;
    const newPlaylistName = randomString();

    const res = await new Promise((resolve, reject) =>
      request.post(
        {
          jar,
          form: {
            action: 'insert',
            eId: post.eId,
            name: name,
            pId: pId,
            pl: { id: 'create', name: newPlaylistName },
          },
          url: `${URL_PREFIX}/api/post`,
        },
        (error, response, body) =>
          error ? reject(error) : resolve({ response, body })
      )
    );

    const postedTrack = JSON.parse(res.body);

    assert.equal(postedTrack.name, name);
    assert.equal(postedTrack.eId, post.eId);
    assert.ok(postedTrack.pl.id);
    assert.equal(postedTrack.pl.name, newPlaylistName);
    assert.equal(postedTrack.uId, ADMIN_USER.id);
    assert.equal(postedTrack.uNm, ADMIN_USER.name);
    assert.deepEqual(postedTrack.lov, []);
    assert.equal(postedTrack.text, '');
    assert.equal(postedTrack.nbP, 0);
    assert.equal(postedTrack.nbR, 0);

    assert.notEqual(postedTrack._id, pId);

    assert.equal(postedTrack.repost.pId, pId);
    assert.equal(postedTrack.repost.uId, ADMIN_USER.id);
    assert.equal(postedTrack.repost.uNm, ADMIN_USER.name);
  });
});
