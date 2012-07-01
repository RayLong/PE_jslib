var mobilesafari = /AppleWebKit.*Mobile/.test(navigator.userAgent);
function VectorEditor(elem, width, height){
  if (typeof(Raphael) != "function") { //check for the renderer
      return alert("Error! Renderer is Missing!"); //if renderer isn't there, return false;
  }
  
  this.container = elem
  this.draw = Raphael(elem, width, height);
  
  this.draw.editor = this;
  
  this.onHitXY = [0,0]
  this.offsetXY = [0,0]
  this.tmpXY = [0,0]

  this.mode = "select";
  this.selectbox = null;
  this.selected = []
  
  this.action = "";
  
  this.selectadd = false;
  
  this.shapes = []
  this.trackers = []
  
  this.listeners = {};
  
  
  var draw = this.draw;
  
  
  //THE FOLLOWING LINES ARE MOSTLY POINTLESS!
  
  function offset(){
    //technically, vX.pos works too and I should probably use whatever I built here, but I have jQuery instead.
    if(window.Ext)return Ext.get(elem).getXY();
    if(window.jQuery){
      var pos = jQuery(elem).offset();
      return [pos.left, pos.top];
    }
    if(window.vx){ //vx support
      var pos = vx.pos(elem);
      return [pos.l, pos.t]
    }
    return [0,0]
  }
  
  function bind(fn, scope){
    return function(){return fn.apply(scope, array(arguments))}
  }

  function array(a){
    for(var b=a.length,c=[];b--;)c.push(a[b]);
    return c;
  }
  if(window.Ext){
    Ext.get(elem).on("mousedown",function(event){
      event.preventDefault()
      
      if(event.button == 2){
        //this.lastmode = this.mode;
        this.setMode("select") //tempselect
      }
      if(event.button == 1){
        return;
      }
      this.onMouseDown(event.getPageX() - offset()[0], event.getPageY() - offset()[1], event.getTarget())
      return false;
    }, this);
    Ext.get(elem).on("mousemove",function(event){
      event.preventDefault()
      this.onMouseMove(event.getPageX()  - offset()[0], event.getPageY()- offset()[1], event.getTarget())
      return false;
    }, this)
    Ext.get(elem).on("mouseup",function(event){
      event.preventDefault()
      this.onMouseUp(event.getPageX() - offset()[0], event.getPageY() - offset()[1], event.getTarget())
      return false;
    }, this)
    Ext.get(elem).on("dblclick",function(event){
      event.preventDefault()
      this.onDblClick(event.getPageX() - offset()[0], event.getPageY()- offset()[1], event.getTarget())
      return false;
    }, this)
  }else if(window.jQuery){
    $(elem).mousedown(bind(function(event){
      event.preventDefault()
      
      if(event.button == 2){
        //this.lastmode = this.mode;
        this.setMode("select") //tempselect
      }
      this.onMouseDown(event.clientX - offset()[0], event.clientY - offset()[1], event.target)
    }, this));
    $(elem).mousemove(bind(function(event){
      event.preventDefault()
      this.onMouseMove(event.clientX - offset()[0], event.clientY - offset()[1], event.target)
    }, this));
    $(elem).mouseup(bind(function(event){
      event.preventDefault()
      this.onMouseUp(event.clientX - offset()[0], event.clientY - offset()[1], event.target)
    }, this));
    $(elem).dblclick(bind(function(event){
      event.preventDefault()
      this.onDblClick(event.clientX - offset()[0], event.clientY - offset()[1], event.target)
    }, this));
    if(mobilesafari){
    elem.addEventListener("touchstart", bind(function(event){
      event.preventDefault()
      this.onMouseDown(event.touches[0].pageX - offset()[0], event.touches[0].pageY - offset()[1], event.target)
    }, this) ,false)
    
    elem.addEventListener("touchmove", bind(function(event){
      event.preventDefault()
      this.onMouseMove(event.touches[0].pageX - offset()[0], event.touches[0].pageY - offset()[1], event.target)
    }, this), false);
    elem.addEventListener("touchend", bind(function(event){
      event.preventDefault()
      this.onMouseUp(0, 0, event.target)
    }, this), false);
	elem.addEventListener("selectstart", function(event){
      event.preventDefault()
	  return false
    }, false);
   }
  }
}

VectorEditor.prototype.setMode = function(mode){
  this.fire("setmode",mode)
  if(mode == "select+"){
    this.mode = "select";
    this.selectadd = true;
    this.unselect()
  }else if(mode == "select"){
    this.mode = mode;
    this.unselect()
    this.selectadd = false;
  }else if(mode == "delete"){
    this.deleteSelection();
    this.mode = mode;
  }else{
    this.unselect()
    this.mode = mode;
  }
}

VectorEditor.prototype.on = function(event, callback){
  if(!this.listeners[event]){
    this.listeners[event] = []
  }
  
  if(this.in_array(callback,this.listeners[event])  ==  -1){
    this.listeners[event].push(callback);
  }
}


VectorEditor.prototype.returnRotatedPoint = function(x,y,cx,cy,a){
    // http://mathforum.org/library/drmath/view/63184.html
    
    // radius using distance formula
    var r = Math.sqrt((x-cx)*(x-cx) + (y-cy)*(y-cy));
    // initial angle in relation to center
    var iA = Math.atan2((y-cy),(x-cx)) * (180/Math.PI);

    var nx = r * Math.cos((a + iA)/(180/Math.PI));
    var ny = r * Math.sin((a + iA)/(180/Math.PI));

    return [cx+nx,cy+ny];
}

VectorEditor.prototype.fire = function(event){
  if(this.listeners[event]){
    for(var i = 0; i < this.listeners[event].length; i++){
      if(this.listeners[event][i].apply(this, arguments)===false){
        return false;
      }
    }
  }
}

VectorEditor.prototype.un = function(event, callback){
  if(!this.listeners[event])return;
  var index = 0;
  while((index = this.in_array(callback,this.listeners[event])) != -1){
    this.listeners[event].splice(index,1);
  }
}

//from the vXJS JS Library
VectorEditor.prototype.in_array = function(v,a){
  for(var i=a.length;i--&&a[i]!=v;);
  return i
}

//from vX JS, is it at all strange that I'm using my own work?
VectorEditor.prototype.array_remove = function(e, o){
  var x=this.in_array(e,o);
  x!=-1?o.splice(x,1):0
}


VectorEditor.prototype.is_selected = function(shape){
  return this.in_array(shape, this.selected) != -1;
}

VectorEditor.prototype.set_attr = function(){
  for(var i = 0; i < this.selected.length; i++){
    this.selected[i].attr.apply(this.selected[i], arguments)
  }
}

VectorEditor.prototype.onMouseDown = function(x, y, target){
  this.fire("mousedown")
  this.tmpXY = this.onHitXY = [x,y]
  
  if(this.mode == "select" && !this.selectbox){

    var shape_object = null
    if(target.shape_object){
      shape_object = target.shape_object
    }else if(target.parentNode.shape_object){
      shape_object = target.parentNode.shape_object
    }else if(!target.is_tracker){
      if(!this.selectadd) this.unselect();
      this.selectbox = this.draw.rect(x, y, 0, 0)
        .attr({"fill-opacity": 0.15, 
              "stroke-opacity": 0.5, 
              "fill": "#007fff", //mah fav kolur!
              "stroke": "#007fff"});
      return; 
    }else{
      return; //die trackers die!
    }
    
    if(this.selectadd){
      this.selectAdd(shape_object);
      this.action = "move";
    }else if(!this.is_selected(shape_object)){
      this.select(shape_object);
      this.action = "move";
    }else{
      this.action = "move";
    }

    if (shape_object.hovered_rect)
            shape_object.hovered_rect.remove();
 
    this.offsetXY = [shape_object.attr("x") - x,shape_object.attr("y") - y]
    
  }
  return false;
}

VectorEditor.prototype.onMouseMove = function(x, y, target){
  this.fire("mousemove")
  if(this.mode == "select" || this.mode == "delete"){
    if(this.selectbox){
      this.resize(this.selectbox, x - this.onHitXY[0], y - this.onHitXY[1], this.onHitXY[0], this.onHitXY[1])
    }else if(this.mode == "select"){
      if(this.action == "move"){
        for(var i = 0; i < this.selected.length; i++){
          this.move(this.selected[i], x - this.tmpXY[0], y - this.tmpXY[1])
        }
        //this.moveTracker(x - this.tmpXY[0], y - this.tmpXY[1])
        this.updateTracker();
        this.tmpXY = [x, y];
        
      }else if(this.action == "rotate"){
        //no multi-rotate
        var box = this.selected[0].getBBox()
        var rad = Math.atan2(y - (box.y + box.height/2), x - (box.x + box.width/2))
        var deg = ((((rad * (180/Math.PI))+90) % 360)+360) % 360;
        this.selected[0].rotate(deg, true); //absolute!
        //this.rotateTracker(deg, (box.x + box.width/2), (box.y + box.height/2))
        this.updateTracker();
      }else if(this.action == "resize"){
        if(!this.onGrabXY){ //technically a misnomer
          if(this.selected[0].type == "path"){
            this.onGrabXY = []
          }else{
            this.onGrabXY = [
              this.selected[0].attr("x"),
              this.selected[0].attr("y")
            ]
          }
          //this.onGrabBox = this.selected[0].getBBox()
        }
        var box = this.selected[0].getBBox();
        var nxy = this.returnRotatedPoint(x, y, box.x + box.width/2, box.y + box.height/2, -this.selected[0].attr("rotation"));
        x = nxy[0]; 
        y = nxy[1]; 
        if(this.selected[0].type == "image"){
          var new_w; 
          var new_h;
          new_w = x - box.x;
          new_w = new_w > 1 ? new_w : 1;
          new_h = y - box.y;
          new_h = new_h > 1 ? new_h : 1;
          this.resize(this.selected[0], new_w, new_h, this.onGrabXY[0], this.onGrabXY[1])
          this.selected[0].translate(-(new_w-box.width)/2,
                                     -(new_h-box.height)/2);
        }else if(this.selected[0].type == "path"){
	  var sx=(x - (box.x+box.width/2))/(box.width/2);
	  var sy=(y - (box.y+box.height/2))/(box.height/2);
	  var scale_attr=this.selected[0].attr('scale');  
	  sx=sx*scale_attr.x;
	  sy=sy*scale_attr.y;
	  if (sx * box.width < 1)
		  sx=1/box.width;
	  if (sy * box.height < 1 )
		  sy=1/box.height;
          this.selected[0].scale(sx, sy); //, box.x+box.width/2, box.y+box.height/2);
        }
        this.newTracker(this.selected[0])
      }
    }
  }
  
  return false;
}


VectorEditor.prototype.getMarkup = function(){
    return this.draw.canvas.parentNode.innerHTML;
}


VectorEditor.prototype.onDblClick = function(x, y, target){
  this.fire("dblclick")
  if(this.selected.length == 1){
    if(this.selected[0].getBBox().height == 0 && this.selected[0].getBBox().width == 0){
      this.deleteShape(this.selected[0])
    }
    if(this.mode == "polygon"){
      //this.selected[0].andClose()
      this.unselect()
    }
  }
  return false;
}



VectorEditor.prototype.onMouseUp = function(x, y, target){
  this.fire("mouseup")
  this.onGrabXY = null;
  
  if(this.mode == "select" || this.mode == "delete"){
    if(this.selectbox){
      var sbox = this.selectbox.getBBox()
      var new_selected = [];
      for(var i = 0; i < this.shapes.length; i++){
        if(this.rectsIntersect(this.shapes[i].getBBox(), sbox)){
          new_selected.push(this.shapes[i])
        }
      }
      
      if(new_selected.length == 0 || this.selectadd == false){
        this.unselect()
      }
      
      if(new_selected.length == 1 && this.selectadd == false){
        this.select(new_selected[0])
      }else{
        for(var i = 0; i < new_selected.length; i++){
          this.selectAdd(new_selected[i])
        }
      }
      if(this.selectbox.node.parentNode){
        this.selectbox.remove()
      }
      this.selectbox = null;
      
      if(this.mode == "delete"){
        this.deleteSelection();
      }
      
    }else{
      this.action = "";
    }
  }
  
  return false;
}


