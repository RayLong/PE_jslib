var poster_editor={
    template_type: "free_template",

    raphael_editor: null,

    canvas_div:null,
    
    backgroundImage: null,


    attachCanvas: function(canvas) {
	if ( this.canvas_div !== canvas ) {
		this.canvas_div=canvas;
	        this.raphael_editor = new VectorEditor(canvas, canvas.offsetWidth, canvas.offsetHeight);
		this.canvas_div.className="free_template";
		this.raphael_editor.setMode("select");
	}
    },
    
    setBackgroundImage: function(url) {
	if(this.canvas_div) {
	      this.backgroundImage=url;
	      this.canvas_div.style.backgroundImage="url('"+url+"')";
	      this.canvas_div.style.backgroundRepeat="no-repeat";
	      this.canvas_div.style.backgroundPosition="center";
	}
    },
    
    /* add image into canvas, "url" is image source, "x,y" is the left-top corner of image, "w,h" is the width and height of image, if the width and height are invalid, value for example <=0, this function will use original size of image to draw. */
    addImage: function (url, x, y, w, h) {
      if (!this.raphael_editor)
	    throw "editor hasn't initialized!";
      var shape=this.raphael_editor.draw.image(url,x,y,w,h);
      this.raphael_editor.addShape(shape,1);
      if ( ( ! w || ( w < 1 ) ) || ( ! h || ( h < 1 ) ) ) {
         var img=document.createElement('img');
         img.onload=function() {
            shape.attr("width",img.width);
            shape.attr("height",img.height);
         }
         img.src=url;
      }
         
      return shape;
    },

    getAttrs: function (Obj) {
       
      if (!this.raphael_editor)
         throw "editor hasn't initialized!";
      if( this.raphael_editor.in_array(Obj,this.raphael_editor.shapes) != -1) {
         if (Obj.type == 'image') {
            return {src:Obj.node.src,
                    left:Obj.attr("x"),
                    top:Obj.attr("y"),
                    width:Obj.attr("width"),
                    height:Obj.attr("height"),
                    angle:Obj.attr("rotation")
                   };
         }else if (Obj.type == 'path' && (Obj.node.id.search('text_') == 0)) {
            var box=Obj.getBBox();
            return { text: Obj.node.textContent,
                     left:box.x,
                     top:box.y,
                     width:box.width,
                     height:box.height,
                     angle: Obj.attr("rotation")
                   };
         }
      }
    },

    convObjToJSON: function (Obj) {
      if (!this.raphael_editor)
         throw "editor hasn't initialized!";
      if( this.raphael_editor.in_array(Obj,this.raphael_editor.shapes) != -1) {
         if (Obj.type == 'image') {
	     //var cx=Obj.attr("x")+Obj.attr("width")/2, cy=Obj.attr("y")+Obj.attr("height")/2;   
             return JSON.stringify({type:'image',
                      left: Obj.attr("x"), top: Obj.attr("y"),
                      //cx:cx,cy:cy,
                      width:Obj.attr("width"),height:Obj.attr("height"),angle:Obj.attr("rotation"),
                      src:Obj.node.src});
         }
         else if (Obj.type == 'path' && ( Obj.node.id.search('text_') == 0 )) {
             var box=Obj.getBBox();
 //          var cx=box.x+box.width/2;
  //         var cy=box.y+box.height/2;
             return JSON.stringify({type:'text', 
                     left: box.x, top: box.y,
                     //cx:box.x, cy:box.y, 
                     width: box.width, height: box.height, 
                     angle: Obj.attr('rotation'), 
                     fontFamily: Obj.node.style.fontFamily, 
                     fontSize: Obj.node.style.fontSize, 
                     color: Obj.node.style.color, 
                     fontStyle: Obj.node.style.fontStyle,
                     text: Obj.node.textContent,
                     path: Obj.attr('path').toString() });
         }
      } else
        return {};
    },

    deleteObject: function(Obj) {
       if (!this.raphael_editor)
           throw "editor hasn't initialized!";
       if( this.raphael_editor.in_array(Obj,this.raphael_editor.shapes) != -1) {
           this.raphael_editor.deleteShape(Obj);
       }
    },
 
    getSelected: function() {

       if (this.raphael_editor && this.raphael_editor.selected.length)
          return this.raphael_editor.selected;
       else
          return []

    },

    addTextByPath: function (text, x, y, path, options) {
        if (! path || ! text)
           throw "no text string or path defined";
        x = x ? x : 0;
        y = y ? y : 0;
        if (! options)
           var options={fontSize:'16',fontColor:'black',
                        fontStyle:'normal',fontFamily:'arial'};
        options.fontSize=options.fontSize || '16';
        options.fontColor=options.fontColor || 'black';
        options.fontStyle=options.fontStyle || 'normal';
        options.fontFamily=options.fontFamily || 'arial';
	var path_txt=path;
	var shape=this.raphael_editor.draw.path(path_txt);
	shape.node.id="text_"+shape.id;
	shape.node.style.fontSize=options.fontSize;
	shape.node.style.fontFamily=options.fontFamily;
	shape.node.style.color=options.fontColor;
	shape.node.style.fontStyle=options.fontStyle;
	shape.node.textContent=text;
	shape.translate(x,y);
	shape.attr({fill:options.fontColor,fillOpacity:1,stroke:options.fontColor});
	this.raphael_editor.addShape(shape,1);
	return shape;
    },

    loadFromJSON: function(J_string) {
        var p;
	if (this.raphael_editor == null)
            throw "Editor hasn't initialized!";
        p=JSON.parse(J_string);
        //input JSON string validation
        if (! p.type)
           throw "template type is not defined";
        if ( ! ( Object.prototype.toString.apply(p.objects) === '[object Array]' ) )
           throw "no objects array defined";
        p.backgroundImage || this.setBackgroundImage(p.backgroundImage);
        this.template_type=p.type;

        this.raphael_editor.deteleAll();

        for (var ii = 0; ii < p.objects.length; ii ++) {
            var shape=p.objects[ii];
            if (shape.type == "image") {
                var image=this.raphael_editor.addImage(shape.src, shape.left, shape.top, shape.width, shape.height);
                image.attr("rotation",shape.angle);
            } else if (shape.type == "text") {
                var text=this.raphael_editor.addTextByPath(shape.text, shape.left, shape.top, shape.path, {fontFamily:shape.fontFamily,fontSize:shape.fontSize,fontColor:shape.color,fontStyle:shape.fontStyle});
                text.attr("rotation",shape.angle);
                var box=text.getBBox();
                text.scale(shape.width/box.width,shape.height/box.height);
            } 
        }
    },

    saveToJSON: function () {
        if (this.raphael_editor == null)
            return "";

	var txt='{"type":"free_template","backgroundImage":"'+
		this.backgroundImage+'","objects":[';
	var shapes=this.raphael_editor.shapes;
	for (var ii=0; ii < shapes.length; ii++) {
	    if (ii != 0)
		    txt+=",";
	    txt+=this.convObjToJSON(shapes[ii]);
        }
	txt+="]}";
	return txt;
    }
};
