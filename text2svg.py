#!/usr/bin/python
import cairo
import pango
import pangocairo
import argparse


parser=argparse.ArgumentParser(description="Text to SVG converter")

parser.add_argument('-f','--font_type',default='sans', help="set the Font Type")
parser.add_argument('-t','--text_str', required=True,help="the text string to be rendered")

parser.add_argument('-s','--font_size',default='16', help="font size")
parser.add_argument('-c','--font_color',default='0,0,0', help="font color r(0~255),g(0~255),b(0~255)")

parser.add_argument('-y','--font_style',default='normal', help="font style")

parser.add_argument('output_file', nargs='?', default='text.svg', help="out put file")

args=parser.parse_args()

font_size_int=int(args.font_size)
char_cnt=len(args.text_str)
surface=cairo.SVGSurface(None,char_cnt*font_size_int*1.5,font_size_int*1.5)
ctx=cairo.Context(surface)
pctx=pangocairo.CairoContext(ctx)
'''
fonts=pangocairo.CairoFontMap.create_context(pangocairo.cairo_font_map_get_default()).list_families();

for f in fonts:
    print f.get_name()
'''

layout=pctx.create_layout()
layout.set_text(args.text_str)

layout.set_font_description(pango.FontDescription(args.font_type+" "+args.font_style+" "+args.font_size))
(drawn,(x,y,w,h))=layout.get_extents()
attrlist=pango.AttrList()

[r,g,b]=args.font_color.split(',')
[r,g,b]=[int(r)*257,int(g)*257,int(b)*257]
attrlist.insert(pango.AttrForeground(r,g,b,0,char_cnt))
layout.set_attributes(attrlist)
w=w/pango.SCALE
h=h/pango.SCALE
pctx.move_to(0,0)
pctx.show_layout(layout)

file=open(args.output_file,"w")
output_surface=cairo.SVGSurface(file,w,h)
ctx=cairo.Context(output_surface)
ctx.set_source_surface(surface,0,0)
ctx.rectangle(0,0,w,h)
ctx.fill()


output_surface.finish()
surface.finish()


file.close()

