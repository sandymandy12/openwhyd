/**
 * (public) invite page template
 * called when a person is invited to whyd
 * @author adrienjoly, whyd
 **/

var config = require('../models/config.js');
var mainTemplate = require('./mainTemplate.js');

var templateLoader = require('../templates/templateLoader.js');
var pageTemplate = null;

exports.refreshTemplates = function (callback) {
  pageTemplate = templateLoader.loadTemplate(
    'app/templates/invitePage.html',
    callback
  );
};

exports.refreshTemplates();

var FIELDS = [
  'inviteCode',
  'iPo', // post/track from which user was invited
  'fbRequest', // id of facebook request used to invite
  'email',
  'redirect',
];

// TODO : verify usefullness
exports.renderSignupPage = function (p) {
  p = p || {}; // FIELDS + loggedUser
  var params = {
    title: 'Join Openwhyd',
    pageDesc: !p.sender
      ? mainTemplate.defaultPageMeta.desc
      : p.sender.name +
        ' uses Openwhyd to access the billions of tracks available on the web today. ' +
        'Join our community to listen to ' +
        p.sender.name +
        "'s music and add your favorite tracks!",
    pageThumb: !p.sender
      ? mainTemplate.defaultPageMeta.img
      : config.imgUrl('/u/' + p.sender.id),
    urlPrefix: config.urlPrefix,
    whydUrl: config.urlPrefix + '/',
    loggedUid: (p.loggedUser || {}).id || '',
    head: mainTemplate.analyticsHeading,
    sender: p.sender && {
      id: p.sender.id,
      name: p.sender.name,
      img: config.imgUrl('/u/' + p.sender.id),
    },
  };

  FIELDS.forEach(function (field) {
    params[field] = p[field];
  });

  if (p.redirect && p.redirect[0] == '/')
    params.redirect = config.urlPrefix + p.redirect;

  return pageTemplate.render(params);
};

exports.renderInvitePage = function (
  sender,
  loggedUser,
  inviteCode,
  iPo,
  email,
  fbRequest,
  redirect
) {
  var params = {};
  params.title = !inviteCode ? 'Join Openwhyd' : 'Your invitation to Openwhyd';
  params.pageDesc = !sender
    ? mainTemplate.defaultPageMeta.desc
    : sender.name +
      ' uses Openwhyd to access the billions of tracks available on the web today. ' +
      'Join our community to listen to ' +
      sender.name +
      "'s music and add your favorite tracks!";
  params.pageThumb = !sender
    ? mainTemplate.defaultPageMeta.img
    : config.imgUrl('/u/' + sender.id);
  params.urlPrefix = config.urlPrefix;
  params.whydUrl = config.urlPrefix + '/';
  params.loggedUid = loggedUser && loggedUser.id ? loggedUser.id : '';
  params.head = mainTemplate.analyticsHeading;

  if (sender) {
    params.sender = [
      {
        id: sender.id,
        name: sender.name,
        img: config.imgUrl('/u/' + sender.id),
      },
    ];
  }

  if (inviteCode) params.inviteCode = inviteCode;

  if (iPo) params.iPo = iPo;

  if (fbRequest) params.fbRequest = fbRequest;

  if (email) params.email = email; // TODO

  if (redirect)
    params.redirect = (redirect[0] == '/' ? config.urlPrefix : '') + redirect;

  var html = pageTemplate.render(params);
  return html;
};
