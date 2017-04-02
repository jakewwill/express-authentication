var express = require('express');
var mysql = require('mysql');
var dbconfig = require('../config/database');

module.exports = function(app, passport) {
	app.get('/', function(req, res) {
		// Save any passed messages, then set the session message to null
		var flashMessage = req.session.message;
		req.session.message = null;

		res.render('index.ejs', {message: flashMessage});
	});

	app.get('/users', function(req, res) {
		var connection = mysql.createConnection(dbconfig.connection);
		connection.query('USE ' + dbconfig.database);


		var users = [];
		var query = connection.query("SELECT * FROM users");

		// In case of an error retrieving the data
		query.on('error', function(err) { 
			console.log('A database error occured:'); 
			console.log(err);
		});

		// With every result, build the string that is later replaced into // the HTML of the homepage
		query.on('result', function(result) {
		  	users.push(result);
		});

		// When we have worked through all results, we call the callback // with our completed string
		query.on('end', function(result) {
			res.render('users.ejs', {userList: users});
		    connection.end();
		});
	});

	app.get('/login', function(req, res) {
		// render the page and pass in any flash data if it exists
		res.render('login.ejs', { message: req.flash('loginMessage') });
		console.log(req.flash('loginMessage'));
	});

	app.post('/login', passport.authenticate('local-login', {
            successRedirect : '/profile', // redirect to the secure profile section
            failureRedirect : '/login', // redirect back to the signup page if there is an error
            failureFlash : true // allow flash messages
		}),
        function(req, res) {
            console.log("Login attempt...");

            if (req.body.remember) {
              req.session.cookie.maxAge = 1000 * 60 * 3;
            } else {
              req.session.cookie.expires = false;
            }

        	res.redirect('/');
    	}
    );

	app.get('/signup', function(req, res) {
		res.render('signup.ejs', { message: req.flash('signupMessage') });
	});

	app.post('/signup', passport.authenticate('local-signup', {
		successRedirect : '/profile', // redirect to the secure profile section
		failureRedirect : '/signup', // redirect back to the signup page if there is an error
		failureFlash : true // allow flash messages
	}));

	app.get('/profile', isLoggedIn, function(req, res) {
		res.render('profile.ejs', {
			// Get the user out of the session and pass it to the template
			user : req.user
		});
	});

	app.get('/logout', function(req, res) {
		req.logout();
		res.redirect('/');
	});
}

function isLoggedIn(req, res, next) {
	// If user is authenticated in the session, carry on
	if (req.isAuthenticated())
		return next();

	// If they aren't redirect them to the home page
	req.session.message = "Sorry, but you must log in";
	res.redirect('/');
}