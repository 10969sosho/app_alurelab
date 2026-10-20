'use client';

import { useEffect, useId, useState } from 'react';

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

function SearchableRegionField({
  label,
  regions,
  value,
  disabled = false,
  required = false,
  resetKey = '',
  onSelect,
}: {
  label: string;
  regions: Region[];
  value?: string;
  disabled?: boolean;
  required?: boolean;
  resetKey?: string;
  onSelect: (region?: Region) => void;
}) {
  const id = useId();
  const [query, setQuery] = useState('');
  const selected = regions.find((region) => region.code === value);

  useEffect(() => setQuery(''), [resetKey]);

  return (
    <div>
      <label htmlFor={id} className="block text-xs font-medium text-slate-700">
        {label}
      </label>
      <input
        id={id}
        type="text"
        list={`${id}-options`}
        value={query || selected?.name || ''}
        onChange={(event) => {
          const nextValue = event.target.value;
          setQuery(nextValue);
          const match = regions.find((region) => region.name.toLocaleLowerCase() === nextValue.trim().toLocaleLowerCase());
          if (match) {
            setQuery('');
            onSelect(match);
          } else if (!nextValue) {
            onSelect(undefined);
          }
        }}
        onBlur={() => {
          if (query && !regions.some((region) => region.name.toLocaleLowerCase() === query.trim().toLocaleLowerCase())) {
            setQuery('');
          }
        }}
        placeholder={`Ketik atau cari ${label.toLowerCase()}...`}
        disabled={disabled || regions.length === 0}
        required={required}
        autoComplete="off"
        className="w-full px-3 py-2 border border-slate-300 rounded-xs bg-white text-xs outline-none focus:border-[#EE4D2D] disabled:bg-slate-50"
      />
      <datalist id={`${id}-options`}>
        {regions.map((region) => <option key={region.code} value={region.name} />)}
      </datalist>
    </div>
  );
}

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

  const selectRegion = (level: 'province' | 'regency' | 'district' | 'village', region?: Region) => {
    const next = { ...value };

    if (!region) {
      if (level === 'province') {
        Object.assign(next, {
          provinceCode: '', provinceName: '', regencyCode: '', regencyName: '', districtCode: '', districtName: '', villageCode: '', villageName: '',
          areaId: '', areaName: '',
        });
      }
      if (level === 'regency') {
        Object.assign(next, {
          regencyCode: '', regencyName: '', districtCode: '', districtName: '', villageCode: '', villageName: '',
          areaId: '', areaName: '',
        });
      }
      if (level === 'district') {
        Object.assign(next, {
          districtCode: '', districtName: '', villageCode: '', villageName: '', areaId: '', areaName: '',
        });
      }
      if (level === 'village') Object.assign(next, { villageCode: '', villageName: '' });
      onChange(next);
      return;
    }

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

  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 gap-2.5 ${className}`}>
      <SearchableRegionField label="Provinsi" regions={provinces} value={value.provinceCode} required={required} onSelect={(region) => selectRegion('province', region)} />
      <SearchableRegionField label="Kabupaten / Kota" regions={regencies} value={value.regencyCode} disabled={!value.provinceCode} required={required} resetKey={value.provinceCode} onSelect={(region) => selectRegion('regency', region)} />
      <SearchableRegionField label="Kecamatan" regions={districts} value={value.districtCode} disabled={!value.regencyCode} required={required} resetKey={value.regencyCode} onSelect={(region) => selectRegion('district', region)} />
      <SearchableRegionField label="Kelurahan / Desa" regions={villages} value={value.villageCode} disabled={!value.districtCode} required={required} resetKey={value.districtCode} onSelect={(region) => selectRegion('village', region)} />
    </div>
  );
}
