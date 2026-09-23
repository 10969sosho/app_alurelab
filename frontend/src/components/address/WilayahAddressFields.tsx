'use client';

import { useEffect, useState } from 'react';

const API = '/api/wilayah';

export interface WilayahAddressValue {
  provinceCode?: string;
  provinceName?: string;
  regencyCode?: string;
  regencyName?: string;
  districtCode?: string;
  districtName?: string;
  villageCode?: string;
  villageName?: string;
  areaId?: string;
  areaName?: string;
  postalCode?: string;
}

type Region = { code: string; name: string };

interface Props {
  value: WilayahAddressValue;
  onChange: (value: WilayahAddressValue) => void;
  className?: string;
  required?: boolean;
}

function useRegions(path: string) {
  const [regions, setRegions] = useState<Region[]>([]);

  useEffect(() => {
    if (!path) {
      setRegions([]);
      return;
    }

    let active = true;
    fetch(`${API}/${path}.json`)
      .then((response) => response.json())
      .then((payload) => {
        if (active) setRegions(Array.isArray(payload?.data) ? payload.data : []);
      })
      .catch(() => {
        if (active) setRegions([]);
      });

    return () => {
      active = false;
    };
  }, [path]);

  return regions;
}

function biteshipAreaId(regencyCode?: string, districtCode?: string) {
  if (!regencyCode || !districtCode) return '';
  return `ID_ID_${regencyCode.replaceAll('.', '')}_${districtCode.replaceAll('.', '')}`;
}

export function WilayahAddressFields({ value, onChange, className = '', required = false }: Props) {
  const provinces = useRegions('provinces');
  const regencies = useRegions(value.provinceCode ? `regencies/${value.provinceCode}` : '');
  const districts = useRegions(value.regencyCode ? `districts/${value.regencyCode}` : '');
  const villages = useRegions(value.districtCode ? `villages/${value.districtCode}` : '');

  const selectRegion = (level: 'province' | 'regency' | 'district' | 'village', region: Region) => {
    const next = { ...value };

    if (level === 'province') {
      Object.assign(next, {
        provinceCode: region.code,
        provinceName: region.name,
        regencyCode: '', regencyName: '', districtCode: '', districtName: '', villageCode: '', villageName: '',
        areaId: '', areaName: '',
      });
    }
    if (level === 'regency') {
      Object.assign(next, {
        regencyCode: region.code,
        regencyName: region.name,
        districtCode: '', districtName: '', villageCode: '', villageName: '', areaId: '', areaName: '',
      });
    }
    if (level === 'district') {
      Object.assign(next, {
        districtCode: region.code,
        districtName: region.name,
        villageCode: '', villageName: '',
        areaId: biteshipAreaId(value.regencyCode, region.code),
        areaName: region.name,
      });
    }
    if (level === 'village') {
      Object.assign(next, {
        villageCode: region.code,
        villageName: region.name,
      });
    }

    onChange(next);
  };

  const selectClass = 'w-full px-3 py-2 border border-slate-300 rounded-xs bg-white text-xs outline-none focus:border-[#EE4D2D]';

  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 gap-2.5 ${className}`}>
      <label className="block text-xs font-medium text-slate-700">
        Provinsi
        <select required={required} value={value.provinceCode || ''} onChange={(event) => {
          const region = provinces.find((item) => item.code === event.target.value);
          if (region) selectRegion('province', region);
        }} className={selectClass}>
          <option value="">Pilih provinsi</option>
          {provinces.map((region) => <option key={region.code} value={region.code}>{region.name}</option>)}
        </select>
      </label>

      <label className="block text-xs font-medium text-slate-700">
        Kabupaten / Kota
        <select required={required} value={value.regencyCode || ''} disabled={!value.provinceCode} onChange={(event) => {
          const region = regencies.find((item) => item.code === event.target.value);
          if (region) selectRegion('regency', region);
        }} className={selectClass}>
          <option value="">Pilih kabupaten / kota</option>
          {regencies.map((region) => <option key={region.code} value={region.code}>{region.name}</option>)}
        </select>
      </label>

      <label className="block text-xs font-medium text-slate-700">
        Kecamatan
        <select required={required} value={value.districtCode || ''} disabled={!value.regencyCode} onChange={(event) => {
          const region = districts.find((item) => item.code === event.target.value);
          if (region) selectRegion('district', region);
        }} className={selectClass}>
          <option value="">Pilih kecamatan</option>
          {districts.map((region) => <option key={region.code} value={region.code}>{region.name}</option>)}
        </select>
      </label>

      <label className="block text-xs font-medium text-slate-700">
        Kelurahan / Desa
        <select required={required} value={value.villageCode || ''} disabled={!value.districtCode} onChange={(event) => {
          const region = villages.find((item) => item.code === event.target.value);
          if (region) selectRegion('village', region);
        }} className={selectClass}>
          <option value="">Pilih kelurahan / desa</option>
          {villages.map((region) => <option key={region.code} value={region.code}>{region.name}</option>)}
        </select>
      </label>
    </div>
  );
}
