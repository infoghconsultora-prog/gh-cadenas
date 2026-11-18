#!/usr/bin/env python3
"""Lee la SEGUNDA hoja de cada plantilla de «6. CC / Cadenas de custodia individuales» (solo lectura) y guarda
su grilla exacta en plantillas-cc.js: anchos, altos, celdas combinadas, textos, letra, alineación, relleno,
bordes e imágenes. pdf-original.js la dibuja igual en el PDF. Volver a correrlo si se cambia una plantilla.

    ~/Developer/gh-informes/.venv/bin/python herramientas/extraer_plantillas.py
"""
import base64, glob, hashlib, io, json, os, re, sys, warnings
warnings.filterwarnings('ignore')
import openpyxl
from openpyxl.utils import get_column_letter, column_index_from_string

AQUI = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CARPETA = next(iter(sorted(glob.glob(os.path.expanduser(
    '~/Library/CloudStorage/GoogleDrive-*/.shortcut-targets-by-id/*/GH CONSULTORA/3 GH MEDICIONES/6. CC/Cadenas de custodia individuales')),
    key=lambda x: (' (' in x.split('GoogleDrive-')[-1].split('/')[0], x))), '')
ANCHO_DEF, ALTO_DEF = 8.43, 15.0
GROSOR = {'thin': .6, 'hair': .3, 'dotted': .5, 'dashed': .5, 'medium': 1.2, 'mediumDashed': 1.2, 'thick': 1.8, 'double': 1.6}


def color(c):
    try:
        if c is None or c.type != 'rgb' or not isinstance(c.rgb, str): return None
        v = c.rgb[-6:]
        return None if v.upper() in ('000000',) and c.rgb[:2] == '00' else v.upper()
    except Exception:
        return None


def hoja(ws):
    ultima_col = max(ws.max_column, 1)
    for m in ws.merged_cells.ranges: ultima_col = max(ultima_col, m.max_col)
    ultima_fila = ws.max_row
    cols = [round(ws.column_dimensions[get_column_letter(i)].width or ANCHO_DEF, 2) if ws.column_dimensions[get_column_letter(i)].width else ANCHO_DEF
            for i in range(1, ultima_col + 1)]
    filas = [round(ws.row_dimensions[r].height or ALTO_DEF, 2) for r in range(1, ultima_fila + 1)]
    merges = [[m.min_row, m.min_col, m.max_row, m.max_col] for m in ws.merged_cells.ranges]
    dentro = {}
    for m in merges:
        for r in range(m[0], m[2] + 1):
            for c in range(m[1], m[3] + 1):
                dentro[(r, c)] = m
    celdas = []
    for r in range(1, ultima_fila + 1):
        for c in range(1, ultima_col + 1):
            cel = ws.cell(r, c)
            m = dentro.get((r, c))
            b = cel.border
            bordes = {k: GROSOR.get(getattr(b, k).style) for k in ('left', 'right', 'top', 'bottom') if getattr(b, k) is not None and getattr(b, k).style}
            relleno = color(cel.fill.fgColor) if cel.fill is not None and cel.fill.fill_type == 'solid' else None
            texto = '' if cel.value is None else str(cel.value)
            if m and (m[0], m[1]) != (r, c):
                texto = ''
            if not (texto or bordes or relleno): continue
            d = {'r': r, 'c': c}
            if texto:
                f, a = cel.font, cel.alignment
                d.update(t=texto, sz=float(f.sz or 11), b=1 if f.b else 0, i=1 if f.i else 0, u=1 if f.u else 0,
                         h=a.horizontal or '', v=a.vertical or 'bottom', w=1 if a.wrap_text else 0)
                col = color(f.color)
                if col and col != '000000': d['col'] = col
            if bordes: d['bd'] = bordes
            if relleno and relleno != 'FFFFFF': d['f'] = relleno
            celdas.append(d)
    imagenes = []
    for im in ws._images:
        try:
            datos = im._data()
            a = im.anchor
            de = a._from
            ext = getattr(a, 'ext', None)
            if hasattr(a, 'to') and a.to is not None:
                hasta = [a.to.row + 1, a.to.col + 1, a.to.rowOff / 12700, a.to.colOff / 12700]
            else:
                hasta = None
            imagenes.append({'de': [de.row + 1, de.col + 1, de.rowOff / 12700, de.colOff / 12700], 'hasta': hasta,
                             'ext': [ext.width / 12700, ext.height / 12700] if ext is not None else [im.width * .75, im.height * .75],
                             'datos': datos, 'fmt': (im.format or 'png').lower()})
        except Exception as e:
            print('   imagen no leída:', e)
    return {'cols': cols, 'filas': filas, 'merges': merges, 'celdas': celdas, 'imagenes': imagenes,
            'apaisada': ws.page_setup.orientation == 'landscape'}


def main():
    if not CARPETA: sys.exit('No encuentro la carpeta de plantillas')
    salida, banco = {}, {}
    for p in sorted(glob.glob(CARPETA + '/CC *.xlsx')):
        wb = openpyxl.load_workbook(p)
        if len(wb.worksheets) < 2: print('sin segunda hoja:', p); continue
        h = hoja(wb.worksheets[1])
        for im in h['imagenes']:            # las imágenes repetidas se guardan una sola vez
            k = hashlib.sha1(im['datos']).hexdigest()[:12]
            banco[k] = 'data:image/%s;base64,%s' % ('jpeg' if im['fmt'] in ('jpg', 'jpeg') else 'png', base64.b64encode(im['datos']).decode())
            im['img'] = k; del im['datos']
        nombre = os.path.splitext(os.path.basename(p))[0]
        salida[nombre] = h
        print('%-28s %2d cols %2d filas %3d celdas %d imágenes' % (nombre, len(h['cols']), len(h['filas']), len(h['celdas']), len(h['imagenes'])))
    js = ('/* Generado por herramientas/extraer_plantillas.py desde la segunda hoja de cada plantilla de «6. CC». No editar a mano. */\n'
          'window.PLANTILLAS_CC = ' + json.dumps(salida, ensure_ascii=False, separators=(',', ':')) + ';\n'
          'window.IMAGENES_CC = ' + json.dumps(banco, separators=(',', ':')) + ';\n')
    open(os.path.join(AQUI, 'plantillas-cc.js'), 'w', encoding='utf-8').write(js)
    print('plantillas-cc.js: %d KB, %d imágenes distintas' % (len(js) // 1024, len(banco)))


if __name__ == '__main__':
    main()
