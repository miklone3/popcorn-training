(function() {
  "use strict";

  window.App = {
    Setting:{
      apiKey: "c2556faf7036f7827784ff008ff0478e",
      baseUrl:  "http://api.themoviedb.org/3"
  
    },
    Collections:{}
  }

  App.Collections.favoriteMovie = [];

  var MovieModel = function( id, urlImg, title ){
    this.id = id,
    this.img = urlImg,
    this.title = title
  }

  var MovieCollections = function(){
    this.movies = []
  };

  var template = function(id){
    return _.template( $("#"+id).html() );
  };

  var initUrl = function( type, info ){
    return App.Setting.baseUrl + '/'+type+'/'+info+'?api_key=' + App.Setting.apiKey;
  }

  //LOCALSTORAGE SECTION 

  App.initLocalStorage = function(){
    if(!localStorage["favorite"]){
      localStorage["favorite"] = JSON.stringify( App.Collections.favoriteMovie );
    }else{
      App.Collections.favoriteMovie = App.getLocalStorage();
    }
  }

  App.saveLocalStorage = function( collection ){
    localStorage["favorite"] = JSON.stringify( collection );
  };

  App.getLocalStorage = function(){
     var movieFavorite = JSON.parse( localStorage["favorite"] );
     return movieFavorite;
  };

  App.loadFavoriteMovie = function(){
    renderCollection( App.getLocalStorage() ,'favorite')
  };

  App.findLocalStorage = function( id ){
    App.Collections.favoriteMovie = App.getLocalStorage();
    var estado = true;
    for(var i = App.Collections.favoriteMovie.length - 1; i >= 0; i--) {
      if(App.Collections.favoriteMovie[i].id == id) {
        estado = false;  
        break;
      }
    }
    return estado;
  }

  //RENDERS

  var renderCollection = function( collection, name ){
    var $list = $('<ul>');
    _.each(collection, function(item){
      render( item, $list );
    });
    renderView($list, name);
  };

  var render = function( item, container ){ 
    var templates = template( 'templateMovie' );
    container.append( templates( item ) );
  }

  var renderView = function( item, nameContainer ){
    $( '#'+nameContainer ).html( item.html() );
  }

  App.saveMovies = function( data, name, collection ){
    _.each(data, function(item){
      var movie = new MovieModel(item.id, item.poster_path, item.title );
      collection.movies.push(movie);
    });
    renderCollection(collection.movies, name)
  };

  //Getter

  App.getMovies = function( url, nameCollection, collection ){
    $.ajax({
      url: url,
      success: function(data){
        App.saveMovies( data.results, nameCollection, collection );
      }
    });
  };

  var getMovie = function( url , fallback){
    $.ajax({
      url: url,
      success: function(data){
        fallback.apply(this, [data]);
      }
    });
  };

  var getCast = function(id, fallback){
    var url = initUrl('movie', id+'/credits');
    $.ajax({
      url: url,
      success: function(data){
        fallback.apply(this, [data]);
      }
    });
  }

  App.getMovieDetail = function(id){
    var url = initUrl('movie', id);
    var modalMovie;
    $.ajax({
      url: url,
      success: function(data){
        var estado = App.findLocalStorage( id );
        modalMovie = {
          id: data.id,
          title: data.title,
          img: data.poster_path,
          casts: [],
          overview: data.overview,
          year: data.release_date,
          status: estado
        };
        getCast(id, function(data) {
          _.each(data.cast, function(cast){
            var casting = {
              name: cast.name,
              character: cast.character,
              img: cast.profile_path
            };
            modalMovie.casts.push(casting);
          });
          var tmp = template("templateModal")(modalMovie);
          openModal( tmp );
        });
      }
    });
  };

  App.addFavorite = function( item ){

    var id = $(item).attr('href'),
    url = initUrl('movie', id);

    App.Collections.favoriteMovie = App.getLocalStorage();

    if( App.findLocalStorage( id ) ){
      getMovie( url , function(data){
        var movie = new MovieModel(data.id, data.poster_path, data.title );
        App.Collections.favoriteMovie.push( movie );
        App.saveLocalStorage(App.Collections.favoriteMovie);
        App.loadFavoriteMovie()
      })
    }else{
      alert("esta pelicula ya fue añadida a la lista")
    }
  }

  App.removeFavorite = function( item ){
    App.Collections.favoriteMovie = App.getLocalStorage();
    var id = $(item).attr('href');
    for(var i = App.Collections.favoriteMovie.length - 1; i >= 0; i--) {
      if(App.Collections.favoriteMovie[i].id == id) {
         App.Collections.favoriteMovie.splice(i, 1);
         App.saveLocalStorage(App.Collections.favoriteMovie);
         App.loadFavoriteMovie();
         closeModal();
         break;
      }
    }
  }

  var favoriteEvent = function(){
    $('.js-add-favorite').on('click',function(e){
      e.preventDefault();
      App.addFavorite( this );
    });

    $('.js-remove-favorite').on('click',function(e){
      e.preventDefault();
      App.removeFavorite( this );
    });
  }

  var openModal = function( tmp ){ 
    $.magnificPopup.open({
      items:{
        src: tmp
      }, 
      type:'inline'
    });
    favoriteEvent();
  }

  var closeModal = function(){ 
    $.magnificPopup.close();
  }

  var initModalbox = function(){
    $('.movie-list').on('click','.js-modal', function(e){
      e.preventDefault();
      App.getMovieDetail( $(this).attr('href') );
    });
  };


  App.Collections.MoviesPopular = new MovieCollections();
  App.Collections.MoviesTopRated = new MovieCollections();

  var moviesPopularUrl = initUrl( 'movie', 'popular'),
  moviesTopRatedUrl = initUrl( 'movie', 'top_rated');

  App.initLocalStorage();
  App.loadFavoriteMovie();
  initModalbox();

  App.getMovies(  moviesPopularUrl, 'popular', App.Collections.MoviesPopular);
  App.getMovies(  moviesTopRatedUrl, 'top_rated', App.Collections.MoviesTopRated );


})();
