var app = angular.module('hackerNews', ['ui.router']);

app.config([
    '$stateProvider',
    '$urlRouterProvider',
    function ($stateProvider, $urlRouterProvider) {

        $stateProvider
            .state('home', {
                url: '/home',
                templateUrl: '/home.html',
                controller: 'MainCtrl',
                resolve: {
                    postPromise: ['posts', function (posts) {
                        return posts.getAll();
                    }]

                }
            });

        $stateProvider
            .state('posts', {
                url: '/posts/{id}',
                templateUrl: '/posts.html',
                controller: 'PostsCtrl',
                resolve: {
                    post: ['$stateParams', 'posts', function($stateParams, posts) {
                        return posts.get($stateParams.id);
                    }]
                }
            });
        $stateProvider
            .state('login', {
                url: '/login',
                templateUrl: '/login.html',
                controller: 'AuthCtrl',
                onEnter: ['$state', 'auth', function($state, auth){
                    if(auth.isLoggedIn()){
                        $state.go('home');
                    }
                }]
            })
        $stateProvider
            .state('register', {
                url: '/register',
                templateUrl: '/register.html',
                controller: 'AuthCtrl',
                onEnter: ['$state', 'auth', function($state, auth){
                    if(auth.isLoggedIn()){
                        $state.go('home');
                    }
                }]
            });

        $urlRouterProvider.otherwise('home');
    }]);

app.factory('auth', ['$http', '$window', function($http, $window){
    var auth = {};

    auth.saveToken = function (token){
        $window.localStorage['javascriptNinja-token'] = token;
    };

    auth.getToken = function (){
        return $window.localStorage['javascriptNinja-token'];
    }

    auth.isLoggedIn = function(){
        var token = auth.getToken();

        if(token){
            var payload = JSON.parse($window.atob(token.split('.')[1]));

            return payload.exp > Date.now() / 1000;
        } else {
            return false;
        }
    };

    auth.currentUser = function(){
        if(auth.isLoggedIn()){
            var token = auth.getToken();
            var payload = JSON.parse($window.atob(token.split('.')[1]));

            return payload.username;
        }
    };

    auth.register = function(user){
        return $http.post('/register', user).success(function(data){
            auth.saveToken(data.token);
        });
    };

    auth.logIn = function(user){
        return $http.post('/login', user).success(function(data){
            auth.saveToken(data.token);
        });
    };

    auth.logOut = function(){
        console.log('Clicked LOGOUT');
        $window.localStorage.removeItem('javascriptNinja-token');
    };
    return auth;
}])

app.factory('posts', ['$http', 'auth', function ($http, auth) {
    var o = {
        posts: []
    };

    o.getAll = function () {
        console.log("IN o.getall");

        return $http.get('/posts').success(function (data) {
            angular.copy(data, o.posts);
            console.log("factory posts get all");
        });
    };

    o.create = function (post) {
        return $http.post('/posts', post, {
            headers: {Authorization: 'Bearer '+auth.getToken()}
        }).success(function (data) {
            o.posts.push(data);
            console.log("LOOK HERE AT CREATE, Created new post object");
            console.log(data);
        });
    };

    o.upvote = function (post) {
        return $http.put('/posts/' + post._id + '/upvote', null, {
            headers: {Authorization: 'Bearer '+auth.getToken()}
        }).success(function (data) {
                post.upvotes += 1;
            });
    };

    o.downvote = function(post){
        return $http.put('/posts/' + post._id + '/downvote', null,{
            headers: {Authorization: 'Bearer '+auth.getToken()}
        }).success(function (data){
                post.upvotes -= 1;
            });
    };

    o.get = function(id) {
        return $http.get('/posts/' + id).then(function(res){
            console.log("LOOK HERE AT GET");
            console.log(res);
            return res.data;
        });
    };

    o.addComment = function(id, comment) {
        return $http.post('/posts/' + id + '/comments', comment, {
            headers: {Authorization: 'Bearer '+auth.getToken()}
        });
    };

    o.upvoteComment = function(post, comment) {
        return $http.put('/posts/' + post._id + '/comments/'+ comment._id + '/upvote', null, {
            headers: {Authorization: 'Bearer '+auth.getToken()}
        }).success(function(data){
                comment.upvotes += 1;
            });
    };

    o.downvoteComment = function(post, comment) {
        return $http.put('/posts/' + post._id + '/comments/'+ comment._id + '/downvote', null, {
            headers: {Authorization: 'Bearer '+auth.getToken()}
        }).success(function(data){
                comment.upvotes -= 1;
            });
    };

    o.incrementPostNumComments = function (post) {
        return $http.put('/posts/' + post._id + '/incNumComments', null, {
            headers: {Authorization: 'Bearer '+auth.getToken()}
        }).success(function (data) {
            post.upvotes += 1;  //technically this doesnt need to be here since were on a different page than home.
        });
    };
    return o;
}]);

app.controller('MainCtrl', [
'$scope',
'posts',
'auth',
function ($scope, posts, auth) {

    $scope.isLoggedIn = auth.isLoggedIn;
    $scope.posts = posts.posts;

    $scope.addPost = function () {
        console.log('SUP');
        if (!$scope.title || $scope.title === '') {
            return;
        }
        posts.create({
            title: $scope.title,
            link: $scope.link,
            author: 'user',
            upvotes: 0,         //maybe has to be in order?
            numComments: 0
        });

        $scope.title = '';
        $scope.link = '';
    };

    $scope.incrementUpvotes = function (post) {
        posts.upvote(post);
    };

    $scope.decrementUpvotes = function (post) {
        posts.downvote(post);
    };

}]);

app.controller('PostsCtrl', [
'$scope',
'posts',
'post',
'auth',
function ($scope, posts, post, auth) {

    $scope.isLoggedIn = auth.isLoggedIn;
    $scope.post = post;

    $scope.incrementUpvotes = function(comment){
        posts.upvoteComment(post, comment);
    };

    $scope.decrementUpvotes = function (comment) {
        posts.downvoteComment(post, comment);
    };

    $scope.addComment = function () {
        if($scope.body === '') { return; }
        posts.incrementPostNumComments(post);
        posts.addComment(post._id, {
            body: $scope.body,
            author: 'user'
        }).success(function(comment) {
            $scope.post.comments.push(comment);
            console.log(post);
        });
        $scope.body = '';
    };
}]);

app.controller('AuthCtrl', [
'$scope',
'$state',
'auth',
function($scope, $state, auth){
    $scope.user = {};

    $scope.register = function(){
        auth.register($scope.user).error(function(error){
            $scope.error = error;
        }).then(function(){
            $state.go('home');
        });
    };

    $scope.logIn = function(){
        console.log('HELLO');
        auth.logIn($scope.user).error(function(error){
            $scope.error = error;
        }).then(function(){
            $state.go('home');
        });
    };
}])

app.controller('NavCtrl', [
'$scope',
'auth',
function($scope, auth){
    $scope.isLoggedIn = auth.isLoggedIn;
    $scope.currentUser = auth.currentUser;
    $scope.logOut = auth.logOut;
}]);