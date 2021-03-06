function Gringotts(){
  var self = this,
      container = {},
      el = {},
      all = [];

  var render = {
    el : function(type, html){
      var el = document.createElement(type);
      el.innerHTML = html;
      return el;
    },
    repos : function(){
      var ex, tr, td;
      container.innerHTML = "";
      el = render.el("TABLE", "");
      container.appendChild(el);
      all.sort(function(a, b){
        if(a.name > b.name) return -1;
        else return 1;
      });
      for(var r = all.length - 1; r >= 0; r--){
        repo = all[r];
        tr = document.createElement("TR");
        tr.appendChild(render.el("TD", repo.render.star()));
        tr.appendChild(render.el("TD", repo.render.name()));
        tr.appendChild(render.el("TD", repo.render.desc()));
        tr.appendChild(render.el("TD", repo.render.tags()));
        if(repo.tags) tr.setAttribute("data-tags", repo.tags.join(" "));
        el.appendChild(tr);
      }
    }
  }

  var filters = {
    current : "",
    toggler : {},
    list : {},
    select : {},
    add : function(){
      filters.dropdown();
      var tags = document.querySelectorAll(".tag");
      for(var t = tags.length - 1; t >= 0; t--){
        tags[t].addEventListener("click", filters.go);
      }
    },
    dropdown : function(){
      var output = "";
      filters.select = document.createElement("DIV");
      filters.select.id = "filter_select";
      container.insertBefore(filters.select, el);
      filters.list = Object.keys(filters.list);
      filters.list.sort();
      filters.list.unshift(" ");
      filters.list.reverse();
      for(var f = filters.list.length - 1; f >= 0; f--){
        output += '<a class="tag">' + filters.list[f] + '</a>';
      }
      filters.select.innerHTML = output;
    },
    go : function(){
      filters.current = this.innerText;
      if(filters.current === " "){
        filters.toggler.innerText = "";
      }else{
        filters.toggler.innerText = 'tr:not([data-tags~=' + filters.current + ']){display:none;}';
      }
    }
  }

  function Repo(name, desc, tags, star){
    var repo = this;
    this.name = name;
    this.desc = desc;
    this.tags = tags;
    this.star = star;
    this.render = {
      desc : function(){
        return "<p>" + (repo.desc ? repo.desc : "") + "</p>";
      },
      name : function(){
        return '<a target="_blank" href="http://github.com/ga-dc/' + repo.name + '">' + repo.name + '</a>';
      },
      star : function(){
        if(repo.star === 0){
          return "";
        }
        return "<p>&star;" + repo.star + "</p>";
      },
      tags : function(){
        if(!repo.tags) return "";
        var output = "";
        repo.tags.sort().reverse();
        for(var t = repo.tags.length - 1; t >= 0; t--){
          output += '<a class="tag">' + repo.tags[t] + '</a>';
          filters.list[repo.tags[t]] = true;
        }
        return output;
      }
    }
  }

  var api = {
    url : "",
    links : {},
    max : 0,
    parse : function(raw){
      var repo, r, tags, tagMatcher = new RegExp(/\[[^\]]*\]/), star;
      for(r = raw.length - 1; r >= 0; r--){
        repo = raw[r];
        tags = [];
        if(repo.description){
          tags = repo.description.match(tagMatcher);
          repo.description = repo.description.replace(tagMatcher, "");
          if(tags) tags = tags[0].toLowerCase().replace(/[\[\]]/g, "").split(/,[ ]*/);
        }
        all.push(new Repo(repo.name, repo.description, tags, repo.stargazers_count));
      }
    },
    load : function(){
      var request = new XMLHttpRequest();
      request.open('GET', api.url, true);
      request.onload = function(){
        var link;
        api.parse(JSON.parse(request.responseText));
        var links = request.getResponseHeader("link").split(",");
        for(var l = 0; l < links.length; l++){
          link = links[l].replace(/[\<\> \"]/g, "").split(";rel=");
          api.links[link[1]] = link[0];
        }
        api.max++;
        if(api.max >= 50){
          console.dir(api);
          return false;
        }
        if(api.url === api.links.last){
          render.repos();
          filters.add();
        }else{
          api.url = api.links.next;
          api.load();
        }
      }
      request.send();
    }
  }

  this.init = function(elid, org){
    api.url = "https://api.github.com/orgs/ga-dc/repos?per_page=100&page=1";
    container = document.getElementById(elid);
    filters.toggler = document.createElement("STYLE");
    document.head.appendChild(filters.toggler);
    api.load();
  }

}
