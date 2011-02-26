SET SQL_MODE="NO_AUTO_VALUE_ON_ZERO";

CREATE TABLE `ci_sessions` (
  `session_id` varchar(32) NOT NULL default '',
  `user_agent` varchar(255) default NULL,
  `ip_address` varchar(20) default NULL,
  `last_activity` int(12) default NULL,
  `user_data` mediumtext,
  PRIMARY KEY  (`session_id`)
) ENGINE=MyISAM DEFAULT CHARSET=latin1;

CREATE TABLE `files` (
  `id` int(10) unsigned NOT NULL auto_increment,
  `type` binary(1) NOT NULL,
  `name` varchar(255) NOT NULL,
  `extension` char(5) NOT NULL,
  `size` double unsigned NOT NULL,
  `created` datetime NOT NULL,
  `last_modified` datetime NOT NULL,
  `rosa_name` varchar(64) NOT NULL,
  `parent` int(10) unsigned NOT NULL,
  `data` text NOT NULL,
  `user_id` int(10) unsigned NOT NULL,
  PRIMARY KEY  (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8 AUTO_INCREMENT=1 ;

CREATE TABLE `users` (
  `id` int(10) unsigned NOT NULL auto_increment,
  `username` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `date_register` datetime NOT NULL,
  `last_login` datetime NOT NULL,
  `quota_max` int(10) unsigned NOT NULL,
  `group_id` int(10) unsigned NOT NULL,
  PRIMARY KEY  (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8 AUTO_INCREMENT=1 ;

CREATE TABLE `user_groups` (
  `id` int(10) unsigned NOT NULL auto_increment,
  `name` varchar(255) NOT NULL,
  PRIMARY KEY  (`id`)
) ENGINE=MyISAM  DEFAULT CHARSET=utf8 AUTO_INCREMENT=3 ;

INSERT INTO `user_groups` VALUES (1, 'administrator');
INSERT INTO `user_groups` VALUES (2, 'user');
